package com.esigelec.ehpad_backend.exception;

/** Action refusée à cet utilisateur (HTTP 403), par exemple des médicaments pour une aide-soignante. */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
