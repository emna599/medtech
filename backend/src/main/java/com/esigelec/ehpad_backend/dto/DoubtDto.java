package com.esigelec.ehpad_backend.dto;

import java.time.LocalDateTime;

public record DoubtDto(
        Long id,
        Long residentId,
        String residentName,
        String note,
        LocalDateTime createdAt,
        boolean resolved,
        String reportedBy) {
}
