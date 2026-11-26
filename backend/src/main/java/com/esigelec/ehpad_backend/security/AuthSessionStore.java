package com.esigelec.ehpad_backend.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public class AuthSessionStore {
    private final JdbcTemplate jdbc;

    public AuthSessionStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void create(UUID id, long userId, long lifetimeSeconds) {
        jdbc.update("insert into auth_session (id, user_id, expires_at) values (?, ?, ?)",
                id, userId, OffsetDateTime.now().plusSeconds(lifetimeSeconds));
    }

    public boolean isActive(UUID id, long userId) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists (select 1 from auth_session where id = ? and user_id = ? and expires_at > now())",
                Boolean.class, id, userId));
    }

    public void revoke(UUID id) {
        jdbc.update("delete from auth_session where id = ?", id);
    }

    public void revokeUser(long userId) {
        jdbc.update("delete from auth_session where user_id = ?", userId);
    }

    public void purgeExpired() {
        jdbc.update("delete from auth_session where expires_at <= now()");
    }
}
