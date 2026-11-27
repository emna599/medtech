package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
