package com.esigelec.ehpad_backend.dto;

import java.time.LocalDateTime;

public record MedicalRecordDto(
        String history,
        String treatments,
        LocalDateTime updatedAt
) {
}
