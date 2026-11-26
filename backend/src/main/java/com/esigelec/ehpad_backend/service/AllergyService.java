package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.MedicalAllergyDto;
import com.esigelec.ehpad_backend.dto.AllergyRequestDto;
import com.esigelec.ehpad_backend.entity.Allergy;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.AllergyMapper;
import com.esigelec.ehpad_backend.repository.AllergyRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AllergyService {

    private final AllergyRepository allergyRepository;
    private final ResidentRepository residentRepository;

    public AllergyService(AllergyRepository allergyRepository, ResidentRepository residentRepository) {
        this.allergyRepository = allergyRepository;
        this.residentRepository = residentRepository;
    }

    @Transactional(readOnly = true)
    public List<MedicalAllergyDto> findByResidentId(Long residentId) {
        ensureResidentExists(residentId);
        return allergyRepository.findByResidentId(residentId)
                .stream()
                .map(AllergyMapper::toDto)
                .toList();
    }

    @Transactional
    public MedicalAllergyDto create(Long residentId, AllergyRequestDto request) {
        Resident resident = lockResident(residentId);
        Allergy allergy = AllergyMapper.toEntity(request, resident);
        return AllergyMapper.toDto(allergyRepository.save(allergy));
    }

    @Transactional
    public MedicalAllergyDto update(Long residentId, Long allergyId, AllergyRequestDto request) {
        lockResident(residentId);
        Allergy allergy = allergyRepository.findByIdAndResidentId(allergyId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Allergie introuvable"));

        AllergyMapper.updateEntity(allergy, request);
        return AllergyMapper.toDto(allergyRepository.save(allergy));
    }

    @Transactional
    public void delete(Long residentId, Long allergyId) {
        lockResident(residentId);
        Allergy allergy = allergyRepository.findByIdAndResidentId(allergyId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Allergie introuvable"));
        allergyRepository.delete(allergy);
    }

    private Resident lockResident(Long residentId) {
        return residentRepository.findByIdForUpdate(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
    }

    private void ensureResidentExists(Long residentId) {
        if (!residentRepository.existsById(residentId)) {
            throw new ResourceNotFoundException("Résident introuvable");
        }
    }
}
