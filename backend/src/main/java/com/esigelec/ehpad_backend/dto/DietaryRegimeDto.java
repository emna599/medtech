package com.esigelec.ehpad_backend.dto;

public record DietaryRegimeDto(
        Long id,
        String type,
        String texture,
        String restrictions,
        String intolerances,
        String instructions,
        long version
) {
}
