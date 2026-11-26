package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.service.ResidentDailyService;
import com.esigelec.ehpad_backend.service.ResidentDailyService.DailySummary;
import com.esigelec.ehpad_backend.service.ResidentDailyService.Entry;
import com.esigelec.ehpad_backend.service.ResidentDailyService.EntryRequest;
import com.esigelec.ehpad_backend.service.ResidentDailyService.Preferences;
import com.esigelec.ehpad_backend.service.ResidentDailyService.PreferencesRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/suivi-resident/{id}")
public class ResidentDailyController {
    private final ResidentDailyService service;

    public ResidentDailyController(ResidentDailyService service) {
        this.service = service;
    }

    @GetMapping
    public DailySummary read(@Positive @PathVariable long id) {
        return service.summary(id);
    }

    @PostMapping("/observations")
    @PreAuthorize("hasRole('PERSONNEL')")
    public Entry add(@Positive @PathVariable long id, @Valid @RequestBody EntryRequest request,
                     Authentication authentication) {
        return service.addEntry(id, request, authentication.getName());
    }

    @PutMapping("/preferences")
    @PreAuthorize("hasRole('PERSONNEL')")
    public Preferences preferences(@Positive @PathVariable long id, @Valid @RequestBody PreferencesRequest request,
                                   Authentication authentication) {
        return service.updatePreferences(id, request, authentication.getName());
    }
}
