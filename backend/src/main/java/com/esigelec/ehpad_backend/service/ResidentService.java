package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.entity.MealLocation;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final ResidentCardAssembler assembler;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public ResidentService(ResidentRepository residentRepository,
                           ResidentCardAssembler assembler,
                           CurrentUserService currentUserService,
                           AuditService auditService) {
        this.residentRepository = residentRepository;
        this.assembler = assembler;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    /** Liste des résidents actifs, filtrée par un texte (prénom, nom ou numéro de chambre). */
    @Transactional(readOnly = true)
    public List<ResidentCardDto> list(String search) {
        List<Resident> residents = residentRepository.findAllActive();
        String needle = normalize(search);
        if (!needle.isEmpty()) {
            residents = residents.stream().filter(r -> matches(r, needle)).toList();
        }
        return List.copyOf(assembler.assemble(residents).values());
    }

    @Transactional(readOnly = true)
    public ResidentCardDto get(Long id) {
        Resident resident = residentRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
        return assembler.assemble(List.of(resident)).get(resident.getId());
    }

    /** Retrouve un résident à partir du code anonyme d'un bracelet ou d'un badge (facultatif). */
    @Transactional
    public ResidentCardDto identifyByCode(String code, String username) {
        User user = currentUserService.require(username);
        Resident resident = residentRepository.findActiveByIdentityCode(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Aucun résident associé à ce code"));
        auditService.record(user, "IDENTIFICATION_CODE", "Resident", resident.getId());
        return assembler.assemble(List.of(resident)).get(resident.getId());
    }

    /** Change le lieu du repas du jour (salle à manger / chambre). */
    @Transactional
    public ResidentCardDto changeMealLocation(Long id, MealLocation location, String username) {
        User user = currentUserService.require(username);
        Resident resident = residentRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
        resident.setMealLocation(location);
        auditService.record(user, "CHANGEMENT_LIEU_" + location.name(), "Resident", resident.getId());
        return assembler.assemble(List.of(resident)).get(resident.getId());
    }

    private static boolean matches(Resident r, String needle) {
        String haystack = normalize(r.getFirstName() + " " + r.getLastName() + " "
                + (r.getRoom() == null ? "" : r.getRoom().getNumber()));
        return haystack.contains(needle);
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String decomposed = Normalizer.normalize(value.trim(), Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }
}
