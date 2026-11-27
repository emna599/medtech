package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.MealLocation;

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
}
