package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.MedicalAllergyDto;
import com.esigelec.ehpad_backend.dto.AllergyRequestDto;
import com.esigelec.ehpad_backend.service.AllergyService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@PreAuthorize("hasRole('MEDECIN')")
@RequestMapping("/api/residents/{residentId}/allergies")
public class AllergyController {

    private final AllergyService allergyService;

    public AllergyController(AllergyService allergyService) {
        this.allergyService = allergyService;
    }

    @GetMapping
    public List<MedicalAllergyDto> findByResidentId(@PathVariable("residentId") Long residentId) {
        return allergyService.findByResidentId(residentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalAllergyDto create(@PathVariable("residentId") Long residentId,
                             @Valid @RequestBody AllergyRequestDto request) {
        return allergyService.create(residentId, request);
    }

    @PutMapping("/{allergyId}")
    public MedicalAllergyDto update(@PathVariable("residentId") Long residentId,
                             @PathVariable("allergyId") Long allergyId,
                             @Valid @RequestBody AllergyRequestDto request) {
        return allergyService.update(residentId, allergyId, request);
    }

    @DeleteMapping("/{allergyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("residentId") Long residentId,
                       @PathVariable("allergyId") Long allergyId, @RequestParam("version") long version) {
        allergyService.delete(residentId, allergyId, version);
    }
}
