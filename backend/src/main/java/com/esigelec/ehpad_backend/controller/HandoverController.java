package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.HandoverActionDto;
import com.esigelec.ehpad_backend.dto.HandoverRequest;
import com.esigelec.ehpad_backend.service.HandoverService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/releve")
public class HandoverController {
    private final HandoverService service;

    public HandoverController(HandoverService service) {
        this.service = service;
    }

    @GetMapping
    public HandoverService.Board board() {
        return service.board();
    }

    @PostMapping
    public HandoverActionDto create(@Valid @RequestBody HandoverRequest request, Authentication authentication) {
        return service.create(request, authentication.getName());
    }

    @PostMapping("/{id}/assignment")
    public HandoverActionDto assign(@PathVariable @Positive long id,
                                    @Valid @RequestBody HandoverService.AssignmentRequest request,
                                    Authentication authentication) {
        return service.assign(id, request, authentication.getName());
    }

    @PostMapping("/{id}/complete")
    public HandoverActionDto complete(@PathVariable @Positive long id,
                                      @Valid @RequestBody HandoverService.CompletionRequest request,
                                      Authentication authentication) {
        return service.complete(id, request, authentication.getName());
    }
}
