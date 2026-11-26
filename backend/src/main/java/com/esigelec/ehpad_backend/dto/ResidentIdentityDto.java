package com.esigelec.ehpad_backend.dto;

/** Identité à vérifier avant d'ouvrir la fiche après lecture d'un bracelet. */
public record ResidentIdentityDto(
        Long id,
        String firstName,
        String lastName,
        int age,
        String room,
        String photoUrl,
        String distinguishingFeatures) {}
