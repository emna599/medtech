package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AllergyDto;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.entity.Allergy;
import com.esigelec.ehpad_backend.entity.DietaryRegime;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.repository.AllergyRepository;
import com.esigelec.ehpad_backend.repository.DietaryRegimeRepository;
import com.esigelec.ehpad_backend.repository.IdentityDoubtRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Construit les fiches résident en chargeant allergies, régimes et doutes en une seule fois (pas de N+1). */
@Component
public class ResidentCardAssembler {

    private final AllergyRepository allergyRepository;
    private final DietaryRegimeRepository regimeRepository;
    private final IdentityDoubtRepository doubtRepository;

    public ResidentCardAssembler(AllergyRepository allergyRepository,
                                 DietaryRegimeRepository regimeRepository,
                                 IdentityDoubtRepository doubtRepository) {
        this.allergyRepository = allergyRepository;
        this.regimeRepository = regimeRepository;
        this.doubtRepository = doubtRepository;
    }

    /** À appeler dans une transaction (la chambre du résident est chargée à la demande). */
    public Map<Long, ResidentCardDto> assemble(Collection<Resident> residents) {
        Map<Long, ResidentCardDto> cards = new LinkedHashMap<>();
        if (residents.isEmpty()) {
            return cards;
        }
        List<Long> ids = residents.stream().map(Resident::getId).distinct().toList();

        Map<Long, List<Allergy>> allergies = allergyRepository.findByResidentIdIn(ids).stream()
                .collect(Collectors.groupingBy(a -> a.getResident().getId()));
        Map<Long, List<DietaryRegime>> regimes = regimeRepository.findByResidentIdIn(ids).stream()
                .collect(Collectors.groupingBy(r -> r.getResident().getId()));
        Set<Long> withDoubt = new HashSet<>(doubtRepository.findResidentIdsWithOpenDoubt(ids));

        for (Resident resident : residents) {
            cards.putIfAbsent(resident.getId(), toCard(
                    resident,
                    allergies.getOrDefault(resident.getId(), List.of()),
                    regimes.getOrDefault(resident.getId(), List.of()),
                    withDoubt.contains(resident.getId())));
        }
        return cards;
    }

    private ResidentCardDto toCard(Resident r, List<Allergy> allergies, List<DietaryRegime> regimes, boolean doubt) {
        String regime = join(regimes.stream().map(DietaryRegime::getType).toList(), ", ");
        String texture = regimes.stream().map(DietaryRegime::getTexture)
                .filter(t -> t != null && !t.isBlank()).findFirst().orElse(null);
        String restrictions = join(regimes.stream().map(DietaryRegime::getRestrictions).toList(), "; ");
        String instructions = join(regimes.stream().map(DietaryRegime::getInstructions).toList(), "; ");

        return new ResidentCardDto(
                r.getId(),
                r.getFirstName(),
                r.getLastName(),
                Period.between(r.getBirthDate(), LocalDate.now()).getYears(),
                r.getRoom() == null ? null : r.getRoom().getNumber(),
                r.getRoom() == null ? null : r.getRoom().getFloor(),
                r.getPhotoUrl(),
                r.getMealLocation(),
                r.isNeedsHelp(),
                r.getDistinguishingFeatures(),
                allergies.stream().map(a -> new AllergyDto(a.getName(), a.getSeverity())).toList(),
                regime,
                texture,
                restrictions,
                instructions,
                doubt);
    }

    private static String join(List<String> values, String separator) {
        String joined = values.stream()
                .filter(v -> v != null && !v.isBlank())
                .distinct()
                .collect(Collectors.joining(separator));
        return joined.isEmpty() ? null : joined;
    }
}
