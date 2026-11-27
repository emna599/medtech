package com.esigelec.ehpad_backend.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DiningServiceTest {

    @Test
    void lesRepasChangentAQuinzeHeures() {
        assertEquals("DEJEUNER", DiningService.defaultSlot(LocalTime.of(11, 30)));
        assertEquals("DEJEUNER", DiningService.defaultSlot(LocalTime.of(14, 59)));
        assertEquals("DINER", DiningService.defaultSlot(LocalTime.of(15, 0)));
        assertEquals("DINER", DiningService.defaultSlot(LocalTime.of(19, 0)));
    }

    @Test
    void lundiDeLaSemaine() {
        assertEquals(LocalDate.of(2026, 11, 23), DiningService.mondayOf(LocalDate.of(2026, 11, 26)));
        assertEquals(LocalDate.of(2026, 11, 23), DiningService.mondayOf(LocalDate.of(2026, 11, 23)));
        assertEquals(LocalDate.of(2026, 11, 23), DiningService.mondayOf(LocalDate.of(2026, 11, 29)));
    }
}
