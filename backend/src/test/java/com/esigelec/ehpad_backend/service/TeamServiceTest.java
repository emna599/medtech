package com.esigelec.ehpad_backend.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

/** Un infirmier suit tous les résidents, deux infirmiers en suivent chacun une moitié. */
class TeamServiceTest {

    private static List<Integer> residents(int count) {
        return IntStream.rangeClosed(1, count).boxed().toList();
    }

    @Test
    void oneNurseTakesEveryone() {
        List<List<Integer>> parts = TeamService.split(residents(75), 1);
        assertThat(parts).hasSize(1);
        assertThat(parts.get(0)).hasSize(75);
    }

    @Test
    void twoNursesShareEightyResidentsEvenly() {
        List<List<Integer>> parts = TeamService.split(residents(80), 2);
        assertThat(parts.get(0)).hasSize(40);
        assertThat(parts.get(1)).hasSize(40);
        assertThat(parts.get(1).get(0)).isEqualTo(41);
    }

    @Test
    void remainderGoesToTheFirstParts() {
        List<List<Integer>> parts = TeamService.split(residents(75), 2);
        assertThat(parts.get(0)).hasSize(38);
        assertThat(parts.get(1)).hasSize(37);
    }

    @Test
    void alertsWhenNobodyOrTooFewNurses() {
        assertThat(TeamService.alerts(80, 0, 2)).anyMatch(a -> a.contains("Aucun infirmier"));
        assertThat(TeamService.alerts(80, 1, 2)).anyMatch(a -> a.contains("Plus de 40"));
        assertThat(TeamService.alerts(80, 2, 2)).isEmpty();
        assertThat(TeamService.alerts(80, 2, 0)).anyMatch(a -> a.contains("aide-soignante"));
    }
}
