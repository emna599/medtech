package com.esigelec.ehpad_backend.exception;

/** Élément introuvable (HTTP 404). */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
