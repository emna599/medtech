package com.esigelec.ehpad_backend.dto;

import java.time.LocalDate;
import java.util.List;

public record QrCodeResidentInfoDto(
        Long id,
        String firstName,
        String lastName,
        LocalDate birthDate,
        String roomNumber,
        Integer floor,
        boolean active,
        String photoUrl,
        String distinguishingFeatures,
        List<MedicalAllergyDto> allergies,
        List<DietaryRegimeDto> dietaryRegimes
) {
}
