package com.esigelec.ehpad_backend.exception;

/** Données incohérentes envoyées par le client (HTTP 400). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
