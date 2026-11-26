package com.esigelec.ehpad_backend.security;

import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
    private static final String SECRET = "test-only-secret-with-at-least-thirty-two-characters";
    private final JwtService service = new JwtService(SECRET, 30);

    @Test
    void extractsTheSessionIdentifierFromAValidToken() {
        User user = new User();
        user.setUsername("medecin");
        user.setRole(Role.MEDECIN);
        UUID sessionId = UUID.randomUUID();

        assertThat(service.extractSession(service.generateToken(user, sessionId)))
                .contains(new JwtService.SessionToken("medecin", sessionId));
    }

    @Test
    void rejectsPreviouslyIssuedTokensThatHaveNoSessionIdentifier() {
        String legacy = Jwts.builder().subject("medecin")
                .expiration(Date.from(Instant.now().plusSeconds(1800)))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertThat(service.extractSession(legacy)).isEmpty();
    }
}
