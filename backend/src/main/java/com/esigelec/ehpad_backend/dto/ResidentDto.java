package com.esigelec.ehpad_backend.dto;

import java.time.LocalDate;

public record ResidentDto(Long id, String firstName, String lastName, LocalDate birthDate,
                          LocalDate admissionDate, boolean active, Long roomId, String roomNumber,
                          Integer floor) {
}
