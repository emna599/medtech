package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.MealLocation;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

/**
 * Fiche résident pour le PERSONNEL : identité visuelle, allergies, régime.
 * Volontairement SANS historique médical ni traitements détaillés (réservés au médecin).
 */
public record ResidentCardDto(
        Long id,
        String firstName,
        String lastName,
        int age,
        String room,
        Integer floor,
        String photoUrl,
        MealLocation mealLocation,
        boolean needsHelp,
        String distinguishingFeatures,
        List<AllergyDto> allergies,
        String regime,
        String texture,
        String restrictions,
        String instructions,
        boolean identityDoubt) {

    @JsonProperty("mealRiskVersion")
    public String mealRiskVersion() {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digestField(digest, regime);
            digestField(digest, texture);
            digestField(digest, restrictions);
            digestField(digest, instructions);
            for (AllergyDto allergy : allergies) {
                digestField(digest, allergy.name());
                digestField(digest, allergy.severity());
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 indisponible", error);
        }
    }

    private static void digestField(MessageDigest digest, String value) {
        if (value != null) {
            digest.update(value.getBytes(StandardCharsets.UTF_8));
        }
        digest.update((byte) 0);
    }
}
