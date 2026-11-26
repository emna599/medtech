package com.esigelec.ehpad_backend.security;

import com.esigelec.ehpad_backend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET est trop court : il faut au moins 32 caractères (voir le fichier .env)");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        if (expirationMinutes < 1 || expirationMinutes > 60) {
            throw new IllegalStateException("JWT_EXPIRATION_MINUTES doit être compris entre 1 et 60");
        }
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(User user, UUID sessionId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getUsername())
                .id(sessionId.toString())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public long getExpirationSeconds() {
        return expirationMinutes * 60;
    }

    public record SessionToken(String username, UUID id) {}

    /** Vérifie la signature et l’expiration avant de renvoyer l’identifiant de session. */
    public Optional<SessionToken> extractSession(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            if (claims.getSubject() == null || claims.getId() == null || claims.getExpiration() == null) {
                return Optional.empty();
            }
            return Optional.of(new SessionToken(claims.getSubject(), UUID.fromString(claims.getId())));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
