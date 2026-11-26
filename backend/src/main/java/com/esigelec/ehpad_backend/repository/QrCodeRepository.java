package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.QrCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QrCodeRepository extends JpaRepository<QrCode, Long> {

    List<QrCode> findByResidentId(Long residentId);

    List<QrCode> findByResidentIdAndActiveTrue(Long residentId);

    Optional<QrCode> findByToken(String token);

    Optional<QrCode> findByIdAndResidentId(Long id, Long residentId);
}
