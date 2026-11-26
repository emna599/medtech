package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.MedicalAllergyDto;
import com.esigelec.ehpad_backend.dto.AllergyRequestDto;
import com.esigelec.ehpad_backend.entity.Allergy;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.exception.ConflictException;
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
    private final MealInstructionChanges instructionChanges;

    public AllergyService(AllergyRepository allergyRepository, ResidentRepository residentRepository, MealInstructionChanges instructionChanges) {
        this.allergyRepository = allergyRepository;
        this.residentRepository = residentRepository;
        this.instructionChanges = instructionChanges;
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
        instructionChanges.record(residentId);
        return AllergyMapper.toDto(allergyRepository.saveAndFlush(allergy));
    }

    @Transactional
    public MedicalAllergyDto update(Long residentId, Long allergyId, AllergyRequestDto request) {
        lockResident(residentId);
        Allergy allergy = allergyRepository.findByIdAndResidentId(allergyId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Allergie introuvable"));

        checkVersion(request.version(), allergy.getVersion());
        AllergyMapper.updateEntity(allergy, request);
        allergyRepository.flush();
        if (allergy.getVersion() != request.version()) {
            instructionChanges.record(residentId);
        }
        return AllergyMapper.toDto(allergy);
    }

    @Transactional
    public void delete(Long residentId, Long allergyId, long version) {
        lockResident(residentId);
        Allergy allergy = allergyRepository.findByIdAndResidentId(allergyId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Allergie introuvable"));
        checkVersion(version, allergy.getVersion());
        allergyRepository.delete(allergy);
        instructionChanges.record(residentId);
    }

    private static void checkVersion(Long expected, long actual) {
        if (expected == null || expected != actual) {
            throw new ConflictException("Cette entrée a changé. Rechargez-la avant de poursuivre.");
        }
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
