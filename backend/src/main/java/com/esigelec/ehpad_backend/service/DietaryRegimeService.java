package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.DietaryRegimeDto;
import com.esigelec.ehpad_backend.dto.DietaryRegimeRequestDto;
import com.esigelec.ehpad_backend.entity.DietaryRegime;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.DietaryRegimeMapper;
import com.esigelec.ehpad_backend.repository.DietaryRegimeRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DietaryRegimeService {

    private final DietaryRegimeRepository dietaryRegimeRepository;
    private final ResidentRepository residentRepository;

    public DietaryRegimeService(DietaryRegimeRepository dietaryRegimeRepository,
                                ResidentRepository residentRepository) {
        this.dietaryRegimeRepository = dietaryRegimeRepository;
        this.residentRepository = residentRepository;
    }

    @Transactional(readOnly = true)
    public List<DietaryRegimeDto> findByResidentId(Long residentId) {
        ensureResidentExists(residentId);
        return dietaryRegimeRepository.findByResidentId(residentId)
                .stream()
                .map(DietaryRegimeMapper::toDto)
                .toList();
    }

    @Transactional
    public DietaryRegimeDto create(Long residentId, DietaryRegimeRequestDto request) {
        Resident resident = lockResident(residentId);
        DietaryRegime regime = DietaryRegimeMapper.toEntity(request, resident);
        return DietaryRegimeMapper.toDto(dietaryRegimeRepository.save(regime));
    }

    @Transactional
    public DietaryRegimeDto update(Long residentId, Long regimeId, DietaryRegimeRequestDto request) {
        lockResident(residentId);
        DietaryRegime regime = dietaryRegimeRepository.findByIdAndResidentId(regimeId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Régime alimentaire introuvable"));

        DietaryRegimeMapper.updateEntity(regime, request);
        return DietaryRegimeMapper.toDto(dietaryRegimeRepository.save(regime));
    }

    @Transactional
    public void delete(Long residentId, Long regimeId) {
        lockResident(residentId);
        DietaryRegime regime = dietaryRegimeRepository.findByIdAndResidentId(regimeId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Régime alimentaire introuvable"));
        dietaryRegimeRepository.delete(regime);
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
