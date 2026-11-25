package com.esigelec.ehpad_backend.dto;

import java.util.Map;

/** Format d'erreur JSON renvoyé par l'API. */
public record ApiError(String message, Map<String, String> errors) {

    public static ApiError of(String message) {
        return new ApiError(message, Map.of());
    }
}
