package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.ServiceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Résultat saisi par le soignant : FAIT (servi / donné), REFUSE (avec motif) ou PLUS_TARD.
 * {@code acknowledgeRisk} : le soignant confirme avoir vérifié un point à risque
 * (allergies / texture adaptée pour un repas, médicament à risque) avant de valider FAIT.
 */
public record CompleteRequest(
        @NotNull(message = "Le statut est obligatoire") ServiceStatus status,
        @Size(max = 255, message = "255 caractères maximum") String comment,
        Boolean acknowledgeRisk,
        @Size(max = 64) String mealRiskVersion) {

    /** Vrai si le soignant a explicitement confirmé le point à risque. */
    public boolean riskAcknowledged() {
        return Boolean.TRUE.equals(acknowledgeRisk);
    }
}
