package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.IdentifyRequest;
import com.esigelec.ehpad_backend.dto.ResidentIdentityDto;
import com.esigelec.ehpad_backend.service.ResidentService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BraceletIdentificationController {
    private final ResidentService residents;

    public BraceletIdentificationController(ResidentService residents) {
        this.residents = residents;
    }

    @PostMapping("/api/identification/bracelet")
    public ResidentIdentityDto identify(@Valid @RequestBody IdentifyRequest request, Authentication authentication) {
        return residents.identifyByCode(request.code(), authentication.getName());
    }
}
