package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Code anonyme lu sur un bracelet ou un badge (facultatif). */
public record IdentifyRequest(
        @NotBlank(message = "Le code est obligatoire") @Size(max = 50, message = "50 caractères maximum") String code) {
}
