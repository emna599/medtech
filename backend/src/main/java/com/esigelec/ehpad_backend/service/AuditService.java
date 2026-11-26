package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.AuditLog;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /** Enregistre une action sensible. Doit être appelé dans la transaction de l'action elle-même. */
    public void record(User user, String action, String entityType, Long entityId) {
        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(log);
    }
}
