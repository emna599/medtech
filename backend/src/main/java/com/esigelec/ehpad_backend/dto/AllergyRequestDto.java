package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record AllergyRequestDto(
        @NotBlank(message = "Le nom de l'allergie est obligatoire")
        @Size(max = 100, message = "Le nom de l'allergie ne peut pas dépasser 100 caractères")
        String name,
        @Size(max = 50, message = "La gravité ne peut pas dépasser 50 caractères")
        String severity,
        @PositiveOrZero Long version
) {
}
