package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.MedicalRecordDto;
import com.esigelec.ehpad_backend.dto.ResidentDetailDto;
import com.esigelec.ehpad_backend.dto.ResidentSummaryDto;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.ResidentMapper;
import com.esigelec.ehpad_backend.repository.MedicalRecordRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public ResidentService(ResidentRepository residentRepository,
                           MedicalRecordRepository medicalRecordRepository) {
        this.residentRepository = residentRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    @Transactional(readOnly = true)
    public List<ResidentSummaryDto> findAll() {
        return residentRepository.findAll()
                .stream()
                .map(ResidentMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResidentDetailDto findById(Long id) {
        Resident resident = residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));

        return ResidentMapper.toDetail(resident);
    }

    @Transactional(readOnly = true)
    public MedicalRecordDto findMedicalRecordByResidentId(Long residentId) {
        Resident resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));

        return medicalRecordRepository.findByResidentId(resident.getId())
                .map(ResidentMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier médical introuvable"));
    }
}
