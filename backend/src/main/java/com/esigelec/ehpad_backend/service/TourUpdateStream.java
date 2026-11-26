package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.security.JwtService.SessionToken;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;

@Service
public class TourUpdateStream {
    private static final Duration HEARTBEAT = Duration.ofSeconds(10);
    private static final Duration MAX_CONNECTION = Duration.ofMinutes(5);
    private final JdbcTemplate jdbc;
    private final Semaphore slots = new Semaphore(128);
    private final Map<SseEmitter, Subscription> subscriptions = new ConcurrentHashMap<>();

    public TourUpdateStream(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public SseEmitter subscribe(SessionToken session) {
        if (!slots.tryAcquire()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        }
        SseEmitter emitter = new SseEmitter(MAX_CONNECTION.toMillis());
        subscriptions.put(emitter, new Subscription(session));
        emitter.onCompletion(() -> remove(emitter));
        emitter.onTimeout(() -> finish(emitter));
        emitter.onError(ignored -> remove(emitter));
        return emitter;
    }

    @Scheduled(fixedDelay = 1000)
    void publish() {
        if (subscriptions.isEmpty()) return;
        Long revision = jdbc.queryForObject("select revision from tour_revision where singleton", Long.class);
        Instant now = Instant.now();
        subscriptions.forEach((emitter, subscription) -> {
            boolean changed = subscription.revision == null || !subscription.revision.equals(revision);
            if (!changed && now.isBefore(subscription.heartbeatAt)) return;
            try {
                if (!mayRead(subscription.session)) {
                    finish(emitter);
                    return;
                }
                emitter.send(changed ? SseEmitter.event().data("invalidate") : SseEmitter.event().comment("ping"));
                subscription.revision = revision;
                subscription.heartbeatAt = now.plus(HEARTBEAT);
            } catch (IOException | IllegalStateException disconnected) {
                finish(emitter);
            }
        });
    }

    private boolean mayRead(SessionToken session) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                select exists (
                    select 1 from auth_session s join users u on u.id = s.user_id
                    where s.id = ? and u.username = ? and s.expires_at > now()
                      and u.enabled and u.role in ('PERSONNEL', 'ADMIN')
                      and (u.role = 'ADMIN' or not exists (
                          select 1 from staff_profile p where p.user_id = u.id and p.job = 'SERVICE'
                      ))
                )
                """, Boolean.class, session.id(), session.username()));
    }

    private void finish(SseEmitter emitter) {
        remove(emitter);
        emitter.complete();
    }

    private void remove(SseEmitter emitter) {
        if (subscriptions.remove(emitter) != null) slots.release();
    }

    private static final class Subscription {
        private final SessionToken session;
        private Long revision;
        private Instant heartbeatAt = Instant.EPOCH;

        private Subscription(SessionToken session) {
            this.session = session;
        }
    }
}
