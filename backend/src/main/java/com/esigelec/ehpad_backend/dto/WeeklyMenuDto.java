package com.esigelec.ehpad_backend.dto;

import java.time.LocalDate;
import java.util.List;

/** Menu d'une semaine (lundi à dimanche, déjeuner et dîner). */
public record WeeklyMenuDto(LocalDate weekStart, List<MenuEntryDto> entries) {
}
