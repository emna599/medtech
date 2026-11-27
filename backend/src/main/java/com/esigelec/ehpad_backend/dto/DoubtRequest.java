package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DoubtRequest(
        @NotNull(message = "Le résident est obligatoire") Long residentId,
        @Size(max = 255, message = "255 caractères maximum") String note) {
}
