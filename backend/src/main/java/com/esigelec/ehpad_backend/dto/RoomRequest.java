package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RoomRequest(
        @NotBlank(message = "Le numéro de chambre est obligatoire")
        @Size(max = 20, message = "Numéro trop long")
        String number,

        @NotNull(message = "L'étage est obligatoire")
        @Min(value = 0, message = "Étage invalide")
        @Max(value = 20, message = "Étage invalide")
        Integer floor,

        @NotNull(message = "La capacité est obligatoire")
        @Min(value = 1, message = "La capacité doit être d'au moins 1")
        @Max(value = 20, message = "Capacité trop élevée")
        Integer capacity) {
}
