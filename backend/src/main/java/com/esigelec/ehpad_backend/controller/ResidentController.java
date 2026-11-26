package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.MedicalRecordDto;
import com.esigelec.ehpad_backend.dto.ResidentDetailDto;
import com.esigelec.ehpad_backend.dto.ResidentSummaryDto;
import com.esigelec.ehpad_backend.service.MedicalResidentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {

    private final MedicalResidentService residentService;

    public ResidentController(MedicalResidentService residentService) {
        this.residentService = residentService;
    }

    @GetMapping
    public List<ResidentSummaryDto> findAll() {
        return residentService.findAll();
    }

    @GetMapping("/{id}")
    public ResidentDetailDto findById(@PathVariable Long id) {
        return residentService.findById(id);
    }

    @GetMapping("/{id}/medical-record")
    @PreAuthorize("hasRole('MEDECIN')")
    public MedicalRecordDto findMedicalRecordByResidentId(@PathVariable Long id) {
        return residentService.findMedicalRecordByResidentId(id);
    }
}
