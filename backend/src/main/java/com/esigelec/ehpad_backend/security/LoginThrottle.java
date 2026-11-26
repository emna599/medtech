package com.esigelec.ehpad_backend.security;

import com.esigelec.ehpad_backend.exception.LoginThrottledException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class LoginThrottle {
    private static final int IP_LIMIT = 60;
    private static final int ACCOUNT_LIMIT = 12;
    private static final String RESERVE_ATTEMPT = """
            insert into login_throttle(scope, bucket_key, window_end, attempts)
            values (?, ?, statement_timestamp() + interval '10 minutes', 1)
            on conflict (scope, bucket_key) do update set
                attempts = case when login_throttle.window_end <= statement_timestamp()
                                then 1 else least(login_throttle.attempts + 1, 61) end,
                window_end = case when login_throttle.window_end <= statement_timestamp()
                                  then excluded.window_end else login_throttle.window_end end
            returning attempts, window_end
            """;

    private final JdbcTemplate jdbc;
    private final AuthSessionStore sessions;
    private final AtomicLong nextCleanup = new AtomicLong();

    public LoginThrottle(JdbcTemplate jdbc, AuthSessionStore sessions) {
        this.jdbc = jdbc;
        this.sessions = sessions;
    }

    public void check(String address, String username) {
        long now = System.currentTimeMillis();
        long next = nextCleanup.get();
        if (now >= next && nextCleanup.compareAndSet(next, now + 300_000)) {
            jdbc.update("delete from login_throttle where window_end <= now()");
            sessions.purgeExpired();
        }
        reserve("ip", address, IP_LIMIT);
        reserve("account", username.toLowerCase(Locale.ROOT), ACCOUNT_LIMIT);
    }

    private void reserve(String scope, String key, int limit) {
        jdbc.queryForObject(RESERVE_ATTEMPT, (rs, row) -> {
            if (rs.getInt("attempts") > limit) {
                long remaining = Duration.between(OffsetDateTime.now(),
                        rs.getObject("window_end", OffsetDateTime.class)).toSeconds();
                throw new LoginThrottledException(Math.max(1, remaining + 1));
            }
            return rs.getInt("attempts");
        }, scope, key);
    }
}
