package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record DietaryRegimeRequestDto(
        @NotBlank(message = "Le type de régime est obligatoire")
        @Size(max = 100, message = "Le type de régime ne peut pas dépasser 100 caractères")
        String type,
        @Size(max = 50, message = "La texture ne peut pas dépasser 50 caractères")
        String texture,
        @Size(max = 2000) String restrictions,
        @Size(max = 2000) String intolerances,
        @Size(max = 2000) String instructions,
        @PositiveOrZero Long version
) {
}
