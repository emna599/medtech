package com.esigelec.ehpad_backend.exception;

/** Action impossible à cause de l'état des données ou d'une règle métier (HTTP 409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
