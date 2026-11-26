package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.ServiceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Résultat saisi par le soignant : FAIT (servi / donné), REFUSE (avec motif) ou PLUS_TARD. */
public record CompleteRequest(
        @NotNull(message = "Le statut est obligatoire") ServiceStatus status,
        @Size(max = 255, message = "255 caractères maximum") String comment) {
}
