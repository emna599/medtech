package com.esigelec.ehpad_backend.exception;

/** Même message pour "utilisateur inconnu" et "mauvais mot de passe" (pas de fuite d'information). */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Identifiants invalides");
    }
}
