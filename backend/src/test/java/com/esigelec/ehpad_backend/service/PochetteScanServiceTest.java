package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.entity.MealLocation;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PochetteScanServiceTest {

    private final ResidentCardDto andre = resident(1L, "André", "Girard");
    private final ResidentCardDto jeanne = resident(2L, "Jeanne", "Martin");
    private final ResidentCardDto paul = resident(3L, "Paul", "Martin");

    @Test
    void findsAResidentWhateverTheOrderOfTheNameOnTheLabel() {
        List<ResidentCardDto> all = List.of(andre, jeanne, paul);

        assertThat(PochetteScanService.match("MARTIN JEANNE", all)).containsExactly(jeanne);
        assertThat(PochetteScanService.match("Jeanne Martin", all)).containsExactly(jeanne);
    }

    @Test
    void ignoresAccentsAndPunctuation() {
        assertThat(PochetteScanService.match("GIRARD, ANDRE", List.of(andre, jeanne))).containsExactly(andre);
    }

    @Test
    void doesNotGuessFromTheLastNameAlone() {
        // deux Martin : « MARTIN » seul ne permet pas de choisir, et ne doit retrouver personne
        assertThat(PochetteScanService.match("MARTIN", List.of(jeanne, paul))).isEmpty();
    }

    @Test
    void returnsNothingForAnUnknownName() {
        assertThat(PochetteScanService.match("DUPONT LOUIS", List.of(andre, jeanne))).isEmpty();
    }

    private static ResidentCardDto resident(Long id, String first, String last) {
        return new ResidentCardDto(id, first, last, 85, "1", 1, null, MealLocation.SALLE, false, null,
                List.of(), "Normal", "Normale", null, null, false, null, false);
    }
}
