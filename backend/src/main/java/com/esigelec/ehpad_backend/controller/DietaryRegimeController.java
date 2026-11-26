package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.DietaryRegimeDto;
import com.esigelec.ehpad_backend.dto.DietaryRegimeRequestDto;
import com.esigelec.ehpad_backend.service.DietaryRegimeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@PreAuthorize("hasRole('MEDECIN')")
@RequestMapping("/api/residents/{residentId}/dietary-regimes")
public class DietaryRegimeController {

    private final DietaryRegimeService dietaryRegimeService;

    public DietaryRegimeController(DietaryRegimeService dietaryRegimeService) {
        this.dietaryRegimeService = dietaryRegimeService;
    }

    @GetMapping
    public List<DietaryRegimeDto> findByResidentId(@PathVariable("residentId") Long residentId) {
        return dietaryRegimeService.findByResidentId(residentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DietaryRegimeDto create(@PathVariable("residentId") Long residentId,
                                   @Valid @RequestBody DietaryRegimeRequestDto request) {
        return dietaryRegimeService.create(residentId, request);
    }

    @PutMapping("/{regimeId}")
    public DietaryRegimeDto update(@PathVariable("residentId") Long residentId,
                                   @PathVariable("regimeId") Long regimeId,
                                   @Valid @RequestBody DietaryRegimeRequestDto request) {
        return dietaryRegimeService.update(residentId, regimeId, request);
    }

    @DeleteMapping("/{regimeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("residentId") Long residentId,
                       @PathVariable("regimeId") Long regimeId) {
        dietaryRegimeService.delete(residentId, regimeId);
    }
}
