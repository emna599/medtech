package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AllergyDto;
import com.esigelec.ehpad_backend.dto.DiningDto;
import com.esigelec.ehpad_backend.dto.MenuEntryDto;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.entity.MealLocation;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MenuCompatibilityTest {

    private static final MenuEntryDto FRIDAY = new MenuEntryDto(5, "DEJEUNER", "Céleri rémoulade", "Poisson pané", "Frites", "Mousse au chocolat");

    private static ResidentCardDto resident(List<AllergyDto> allergies, String regime, String texture, String restrictions) {
        return new ResidentCardDto(1L, "A", "B", 80, "1", 1, null, MealLocation.SALLE, false, null, allergies, regime, texture, restrictions, null, false);
    }

    @Test
    void allergieAuPoissonBloqueLePoissonPane() {
        List<DiningDto.Warning> warnings = MenuCompatibility.check(FRIDAY,
                resident(List.of(new AllergyDto("Poisson", "Grave")), "Normal", "Normale", null));
        assertTrue(warnings.stream().anyMatch(w -> w.dish().equals("Poisson pané") && w.level().equals(MenuCompatibility.STOP)));
    }

    @Test
    void regimeSansSelSignaleLesFrites() {
        List<DiningDto.Warning> warnings = MenuCompatibility.check(FRIDAY,
                resident(List.of(), "Sans sel", "Normale", "Sel"));
        assertTrue(warnings.stream().anyMatch(w -> w.dish().equals("Frites") && w.reason().equals("Sans sel")));
    }

    @Test
    void textureMixeeSignaleLesFrites() {
        List<DiningDto.Warning> warnings = MenuCompatibility.check(FRIDAY, resident(List.of(), "Normal", "Mixée", null));
        assertTrue(warnings.stream().anyMatch(w -> w.dish().equals("Frites") && w.reason().equals("À mixer")));
    }

    @Test
    void residentSansProblemeEtMenuAbsent() {
        assertEquals(0, MenuCompatibility.check(FRIDAY, resident(List.of(), "Normal", "Normale", null)).size());
        assertEquals(0, MenuCompatibility.check(null, resident(List.of(new AllergyDto("Gluten", null)), "Normal", "Normale", null)).size());
    }
}
