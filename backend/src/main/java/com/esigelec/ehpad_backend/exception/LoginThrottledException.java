package com.esigelec.ehpad_backend.exception;

public class LoginThrottledException extends RuntimeException {
    private final long retryAfterSeconds;

    public LoginThrottledException(long retryAfterSeconds) {
        super("Trop de tentatives de connexion. Réessayez dans quelques minutes.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
