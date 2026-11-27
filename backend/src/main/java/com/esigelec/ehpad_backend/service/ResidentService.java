package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.dto.ResidentIdentityDto;
import com.esigelec.ehpad_backend.entity.MealLocation;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.time.LocalDate;
import java.time.Period;
import java.util.Locale;

@Service
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final ResidentCardAssembler assembler;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final StaffAssignmentService assignments;

    public ResidentService(ResidentRepository residentRepository,
                           ResidentCardAssembler assembler,
                           CurrentUserService currentUserService,
                           AuditService auditService, StaffAssignmentService assignments) {
        this.residentRepository = residentRepository;
        this.assembler = assembler;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.assignments = assignments;
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

    /**
     * Retrouve un résident à partir du contenu d'un QR code (jeton de la table qr_code, actif) ou du code
     * anonyme d'un bracelet ou d'un badge (facultatif). Le QR peut contenir le jeton seul ou une adresse qui le contient.
     */
    @Transactional
    public ResidentIdentityDto identifyByCode(String code, String username) {
        User user = currentUserService.require(username);
        String token = extractToken(code);

        Resident resident = residentRepository.findResidentIdByActiveQrToken(token)
                .flatMap(residentRepository::findActiveById)
                .orElse(null);
        String action = "IDENTIFICATION_QR";
        if (resident == null) {
            resident = residentRepository.findActiveByIdentityCode(token)
                    .orElseThrow(() -> new ResourceNotFoundException("Aucun résident associé à ce code"));
            action = "IDENTIFICATION_CODE";
        }
        auditService.record(user, action, "Resident", resident.getId());
        String room = resident.getRoom() == null ? null : resident.getRoom().getNumber();
        int age = Period.between(resident.getBirthDate(), LocalDate.now()).getYears();
        return new ResidentIdentityDto(resident.getId(), resident.getFirstName(), resident.getLastName(),
                age, room, resident.getPhotoUrl(), resident.getDistinguishingFeatures());
    }

    /** Extrait le jeton : « abc », « https://site/qr/abc », « https://site/r?token=abc » donnent tous « abc ». */
    static String extractToken(String raw) {
        String value = raw == null ? "" : raw.trim();
        int named = value.toLowerCase(Locale.ROOT).indexOf("token=");
        if (named >= 0) {
            value = value.substring(named + "token=".length());
            int end = value.indexOf('&');
            return (end >= 0 ? value.substring(0, end) : value).trim();
        }
        String lower = value.toLowerCase(Locale.ROOT);
        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            int cut = value.length();
            for (char stop : new char[] {'?', '#'}) {
                int at = value.indexOf(stop);
                if (at >= 0 && at < cut) {
                    cut = at;
                }
            }
            String path = value.substring(0, cut);
            while (path.endsWith("/")) {
                path = path.substring(0, path.length() - 1);
            }
            return path.substring(path.lastIndexOf('/') + 1).trim();
        }
        return value;
    }

    /** Change le lieu du repas du jour (salle à manger / chambre). */
    @Transactional
    public ResidentCardDto changeMealLocation(Long id, MealLocation location, String username) {
        User user = currentUserService.require(username);
        Resident resident = residentRepository.findByIdForUpdate(id).filter(Resident::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
        assignments.requireFloor(user, resident.getRoom() == null ? null : resident.getRoom().getFloor());
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
