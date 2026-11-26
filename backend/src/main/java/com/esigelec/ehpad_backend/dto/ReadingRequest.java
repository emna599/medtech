package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Lecture d'un bracelet par le lecteur d'une table. Le vrai lecteur envoie le jeton du bracelet ;
 * l'écran de démonstration envoie directement l'identifiant du résident (simulation).
 */
public record ReadingRequest(
        @NotBlank(message = "Le code du lecteur est obligatoire") String readerCode,
        String token,
        Long residentId,
        /** Vrai quand le résident se lève (sinon il s'assoit). */
        boolean leaving) {
}
