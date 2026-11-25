package com.esigelec.ehpad_backend.exception;

/** Action impossible dans l'état actuel (déjà enregistré, doute d'identité en cours...). */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
