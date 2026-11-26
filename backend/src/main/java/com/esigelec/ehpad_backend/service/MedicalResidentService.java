package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.MedicalRecordDto;
import com.esigelec.ehpad_backend.dto.MedicalRecordRequest;
import com.esigelec.ehpad_backend.dto.ResidentDetailDto;
import com.esigelec.ehpad_backend.dto.ResidentSummaryDto;
import com.esigelec.ehpad_backend.entity.MedicalRecord;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.ResidentMapper;
import com.esigelec.ehpad_backend.repository.MedicalRecordRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MedicalResidentService {

    private final ResidentRepository residentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AuditService audit;
    private final CurrentUserService users;

    public MedicalResidentService(ResidentRepository residentRepository,
                           MedicalRecordRepository medicalRecordRepository, AuditService audit, CurrentUserService users) {
        this.residentRepository = residentRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.audit = audit;
        this.users = users;
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

    @Transactional
    public MedicalRecordDto saveMedicalRecord(long residentId, MedicalRecordRequest request, String username) {
        String history = cleanText(request.history());
        String treatments = cleanText(request.treatments());
        if (history == null && treatments == null) {
            throw new BadRequestException("Renseignez les antécédents ou les traitements documentés.");
        }
        Resident resident = residentRepository.findByIdForUpdate(residentId).filter(Resident::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Résident actif introuvable"));
        MedicalRecord existing = medicalRecordRepository.findByResidentId(residentId).orElse(null);
        if ((existing == null && request.version() != null)
                || (existing != null && (request.version() == null || existing.getVersion() != request.version()))) {
            throw new ConflictException("Le dossier a changé. Relisez la dernière version avant de modifier.");
        }
        MedicalRecord record = existing;
        if (record == null) {
            record = new MedicalRecord();
            record.setResident(resident);
        }
        record.setHistory(history);
        record.setTreatments(treatments);
        MedicalRecord saved = medicalRecordRepository.saveAndFlush(record);
        audit.record(users.require(username), existing == null ? "DOSSIER_CREE" : "DOSSIER_MODIFIE",
                "MedicalRecord", saved.getId());
        return ResidentMapper.toDto(saved);
    }

    private static String cleanText(String input) {
        if (input == null) return null;
        String text = input.replace("\r\n", "\n").strip();
        if (text.codePoints().anyMatch(code -> (Character.isISOControl(code) && code != '\n')
                || (code >= 0x202A && code <= 0x202E) || (code >= 0x2066 && code <= 0x2069))) {
            throw new BadRequestException("Le texte contient des caractères de contrôle.");
        }
        return text.codePoints().allMatch(code -> Character.isWhitespace(code) || Character.isSpaceChar(code)
                || Character.getType(code) == Character.FORMAT) ? null : text;
    }
}
