package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    Optional<MedicalRecord> findByResidentId(Long residentId);
}
