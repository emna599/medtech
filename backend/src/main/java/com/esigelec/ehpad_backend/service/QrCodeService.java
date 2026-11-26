package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.QrCodeDto;
import com.esigelec.ehpad_backend.entity.QrCode;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.QrCodeMapper;
import com.esigelec.ehpad_backend.repository.QrCodeRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class QrCodeService {

    private final QrCodeRepository qrCodeRepository;
    private final ResidentRepository residentRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public QrCodeService(QrCodeRepository qrCodeRepository,
                         ResidentRepository residentRepository,
                         CurrentUserService currentUserService, AuditService auditService) {
        this.qrCodeRepository = qrCodeRepository;
        this.residentRepository = residentRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<QrCodeDto> findByResidentId(Long residentId) {
        ensureResidentExists(residentId);
        return qrCodeRepository.findByResidentId(residentId)
                .stream()
                .map(QrCodeMapper::toDto)
                .toList();
    }

    @Transactional
    public QrCodeDto generateForResident(Long residentId, Long activeQrCodeId, String username) {
        Resident resident = lockResident(residentId);
        if (!resident.isActive()) {
            throw new ConflictException("Ce résident est inactif");
        }
        User user = currentUserService.require(username);

        LocalDateTime now = LocalDateTime.now();
        List<QrCode> activeQrCodes = qrCodeRepository.findByResidentIdAndActiveTrue(residentId);
        boolean matches = activeQrCodes.isEmpty()
                ? activeQrCodeId == null
                : activeQrCodes.stream().anyMatch(code -> Objects.equals(code.getId(), activeQrCodeId));
        if (!matches) {
            throw new ConflictException("Le code QR actif a changé. Vérifiez le code actuel avant de renouveler.");
        }
        for (QrCode activeQrCode : activeQrCodes) {
            deactivate(activeQrCode, now);
            auditService.record(user, "QR_CODE_DESACTIVE", "QrCode", activeQrCode.getId());
        }

        QrCode qrCode = new QrCode();
        qrCode.setToken(UUID.randomUUID().toString());
        qrCode.setResident(resident);
        qrCode.setUser(user);
        QrCode saved = qrCodeRepository.save(qrCode);
        auditService.record(user, "QR_CODE_GENERE", "QrCode", saved.getId());
        return QrCodeMapper.toDto(saved);
    }

    @Transactional
    public QrCodeDto deactivate(Long residentId, Long qrCodeId, String username) {
        lockResident(residentId);
        QrCode qrCode = qrCodeRepository.findByIdAndResidentId(qrCodeId, residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Code QR introuvable"));

        if (qrCode.isActive()) {
            deactivate(qrCode, LocalDateTime.now());
            auditService.record(currentUserService.require(username), "QR_CODE_DESACTIVE", "QrCode", qrCode.getId());
        }
        return QrCodeMapper.toDto(qrCode);
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

    private void deactivate(QrCode qrCode, LocalDateTime deactivatedAt) {
        if (qrCode.isActive()) {
            qrCode.setActive(false);
            qrCode.setDeactivatedAt(deactivatedAt);
        }
    }
}
