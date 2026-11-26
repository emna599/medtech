package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.security.JwtService;
import com.esigelec.ehpad_backend.service.TourUpdateStream;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class TourUpdateController {
    private final JwtService jwt;
    private final TourUpdateStream stream;

    public TourUpdateController(JwtService jwt, TourUpdateStream stream) {
        this.jwt = jwt;
        this.stream = stream;
    }

    @GetMapping(value = "/api/personnel/service/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> events(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        // Le filtre de sécurité a déjà authentifié cette requête Bearer.
        if (!authorization.startsWith("Bearer ")) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        var session = jwt.extractSession(authorization.substring(7).trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("X-Accel-Buffering", "no")
                .body(stream.subscribe(session));
    }
}
