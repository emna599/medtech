package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.DoubtDto;
import com.esigelec.ehpad_backend.dto.DoubtRequest;
import com.esigelec.ehpad_backend.entity.IdentityDoubt;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.IdentityDoubtRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Doute d'identité : bloque « Servi / Donné » jusqu'à la confirmation par un AUTRE soignant. */
@Service
public class IdentityDoubtService {

    private final IdentityDoubtRepository doubtRepository;
    private final ResidentRepository residentRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public IdentityDoubtService(IdentityDoubtRepository doubtRepository,
                                ResidentRepository residentRepository,
                                CurrentUserService currentUserService,
                                AuditService auditService) {
        this.doubtRepository = doubtRepository;
        this.residentRepository = residentRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<DoubtDto> listOpen() {
        return doubtRepository.findOpenWithDetails().stream().map(IdentityDoubtService::toDto).toList();
    }

    @Transactional
    public DoubtDto report(DoubtRequest request, String username) {
        User user = currentUserService.require(username);
        Resident resident = residentRepository.findActiveById(request.residentId())
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));

        // Un seul doute ouvert par résident : on renvoie celui qui existe déjà.
        IdentityDoubt existing = doubtRepository.findOpenWithDetails().stream()
                .filter(d -> d.getResident().getId().equals(resident.getId()))
                .findFirst().orElse(null);
        if (existing != null) {
            return toDto(existing);
        }

        IdentityDoubt doubt = new IdentityDoubt();
        doubt.setResident(resident);
        doubt.setReportedBy(user);
        doubt.setCreatedAt(LocalDateTime.now());
        String note = request.note() == null ? null : request.note().trim();
        doubt.setNote(note == null || note.isEmpty() ? null : note);
        doubt = doubtRepository.save(doubt);

        auditService.record(user, "DOUTE_IDENTITE", "Resident", resident.getId());
        return toDto(doubt);
    }

    @Transactional
    public DoubtDto resolve(Long id, String username) {
        User user = currentUserService.require(username);
        IdentityDoubt doubt = doubtRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doute introuvable"));
        if (doubt.isResolved()) {
            throw new ConflictException("Ce doute est déjà résolu");
        }
        if (doubt.getReportedBy().getId().equals(user.getId())) {
            throw new ConflictException("Un autre soignant doit confirmer l'identité");
        }
        doubt.setResolved(true);
        doubt.setResolvedAt(LocalDateTime.now());
        doubt.setResolvedBy(user);

        auditService.record(user, "DOUTE_RESOLU", "Resident", doubt.getResident().getId());
        return toDto(doubt);
    }

    private static DoubtDto toDto(IdentityDoubt d) {
        Resident r = d.getResident();
        return new DoubtDto(
                d.getId(),
                r.getId(),
                r.getFirstName() + " " + r.getLastName(),
                d.getNote(),
                d.getCreatedAt(),
                d.isResolved(),
                d.getReportedBy().getFullName());
    }
}
