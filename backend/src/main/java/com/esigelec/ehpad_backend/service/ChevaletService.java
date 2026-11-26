package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.ChevaletDto;
import com.esigelec.ehpad_backend.dto.ChevaletRequest;
import com.esigelec.ehpad_backend.entity.Chevalet;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ChevaletRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

/** Chevalets : associer un numéro de chevalet à un résident (un chevalet par résident, un résident par chevalet). */
@Service
public class ChevaletService {

    private final ChevaletRepository chevaletRepository;
    private final ResidentRepository residentRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public ChevaletService(ChevaletRepository chevaletRepository,
                           ResidentRepository residentRepository,
                           CurrentUserService currentUserService,
                           AuditService auditService) {
        this.chevaletRepository = chevaletRepository;
        this.residentRepository = residentRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Optional<ChevaletDto> forResident(Long residentId) {
        return chevaletRepository.findByResidentId(residentId).map(ChevaletService::toDto);
    }

    @Transactional
    public ChevaletDto associate(ChevaletRequest request, String username) {
        User user = currentUserService.require(username);
        Resident resident = residentRepository.findActiveById(request.residentId())
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
        String code = request.code().trim().toUpperCase(Locale.ROOT);

        Chevalet chevalet = chevaletRepository.findByCodeIgnoreCase(code).orElseGet(() -> new Chevalet(code));
        Resident current = chevalet.getResident();
        if (current != null && !current.getId().equals(resident.getId()) && !request.replace()) {
            throw new ConflictException("Le chevalet n° " + chevalet.getCode() + " est déjà associé à "
                    + current.getFirstName() + " " + current.getLastName() + ". Confirmez pour le réassigner.");
        }

        // Un résident n'a qu'un chevalet : on libère l'ancien avant d'attribuer le nouveau.
        chevaletRepository.findByResidentId(resident.getId())
                .filter(old -> !old.getCode().equalsIgnoreCase(code))
                .ifPresent(old -> {
                    old.setResident(null);
                    old.setAssociatedAt(null);
                    old.setAssociatedBy(null);
                    chevaletRepository.saveAndFlush(old);
                });

        chevalet.setResident(resident);
        chevalet.setAssociatedAt(LocalDateTime.now());
        chevalet.setAssociatedBy(user);
        Chevalet saved = chevaletRepository.saveAndFlush(chevalet);
        auditService.record(user, "CHEVALET_ASSOCIE", "Chevalet", saved.getId());
        return toDto(saved);
    }

    @Transactional
    public void release(Long residentId, String username) {
        User user = currentUserService.require(username);
        chevaletRepository.findByResidentId(residentId).ifPresent(chevalet -> {
            chevalet.setResident(null);
            chevalet.setAssociatedAt(null);
            chevalet.setAssociatedBy(null);
            auditService.record(user, "CHEVALET_LIBERE", "Chevalet", chevalet.getId());
        });
    }

    private static ChevaletDto toDto(Chevalet chevalet) {
        Resident resident = chevalet.getResident();
        return new ChevaletDto(
                chevalet.getId(),
                chevalet.getCode(),
                resident == null ? null : resident.getId(),
                resident == null ? null : resident.getFirstName() + " " + resident.getLastName(),
                chevalet.getAssociatedAt());
    }
}
