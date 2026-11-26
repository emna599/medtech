package com.esigelec.ehpad_backend.dto;

import java.time.LocalDate;

public record ResidentSummaryDto(
        Long id,
        String firstName,
        String lastName,
        LocalDate birthDate,
        boolean active,
        String roomNumber,
        Integer floor
) {
}
