package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Lecture d'un bracelet par le lecteur d'une table. Le vrai lecteur envoie le jeton du bracelet ;
 * l'écran de démonstration envoie directement l'identifiant du résident (simulation).
 */
public record ReadingRequest(
        @NotBlank(message = "Le code du lecteur est obligatoire") @Size(max = 30) String readerCode,
        @Size(max = 100) String token,
        @Positive Long residentId,
        /** Vrai quand le résident se lève (sinon il s'assoit). */
        boolean leaving) {
}
