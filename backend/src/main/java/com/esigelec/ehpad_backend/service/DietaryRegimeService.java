package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.DietaryRegimeDto;
import com.esigelec.ehpad_backend.dto.DietaryRegimeRequestDto;
import com.esigelec.ehpad_backend.entity.DietaryRegime;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.mapper.DietaryRegimeMapper;
import com.esigelec.ehpad_backend.repository.DietaryRegimeRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class DietaryRegimeService {

    private final DietaryRegimeRepository dietaryRegimeRepository;
    private final ResidentRepository residentRepository;
    private final MealInstructionChanges instructionChanges;

    public DietaryRegimeService(DietaryRegimeRepository dietaryRegimeRepository,
                                ResidentRepository residentRepository, MealInstructionChanges instructionChanges) {
        this.dietaryRegimeRepository = dietaryRegimeRepository;
        this.residentRepository = residentRepository;
        this.instructionChanges = instructionChanges;
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
        checkTexture(residentId, null, request.texture());
        DietaryRegime regime = DietaryRegimeMapper.toEntity(request, resident);
        instructionChanges.record(residentId);
        return DietaryRegimeMapper.toDto(dietaryRegimeRepository.saveAndFlush(regime));
    }

    @Transactional
    public DietaryRegimeDto update(Long residentId, Long regimeId, DietaryRegimeRequestDto request) {
        lockResident(residentId);
        DietaryRegime regime = dietaryRegimeRepository.findByIdAndResidentId(regimeId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Régime alimentaire introuvable"));

        checkVersion(request.version(), regime.getVersion());
        if (!Objects.equals(normalizeTexture(request.texture()), normalizeTexture(regime.getTexture()))) {
            checkTexture(residentId, regimeId, request.texture());
        }
        DietaryRegimeMapper.updateEntity(regime, request);
        dietaryRegimeRepository.flush();
        if (regime.getVersion() != request.version()) {
            instructionChanges.record(residentId);
        }
        return DietaryRegimeMapper.toDto(regime);
    }

    @Transactional
    public void delete(Long residentId, Long regimeId, long version) {
        lockResident(residentId);
        DietaryRegime regime = dietaryRegimeRepository.findByIdAndResidentId(regimeId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Régime alimentaire introuvable"));
        checkVersion(version, regime.getVersion());
        dietaryRegimeRepository.delete(regime);
        instructionChanges.record(residentId);
    }

    private void checkTexture(Long residentId, Long editedId, String requestedTexture) {
        String texture = normalizeTexture(requestedTexture);
        if (texture == null) return;
        boolean conflict = dietaryRegimeRepository.findByResidentId(residentId).stream()
                .filter(regime -> !regime.getId().equals(editedId))
                .map(regime -> normalizeTexture(regime.getTexture()))
                .anyMatch(other -> other != null && !other.equals(texture));
        if (conflict) {
            throw new ConflictException("Une autre texture adaptée est déjà enregistrée pour ce résident.");
        }
    }

    private static String normalizeTexture(String texture) {
        if (texture == null || texture.isBlank() || texture.strip().equalsIgnoreCase("Normale")) return null;
        return texture.strip().toLowerCase(Locale.ROOT);
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
