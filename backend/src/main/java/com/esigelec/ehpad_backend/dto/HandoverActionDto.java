package com.esigelec.ehpad_backend.dto;

import java.time.OffsetDateTime;

public record HandoverActionDto(
        long id,
        Long residentId,
        String residentName,
        String observation,
        String expectedAction,
        String authorName,
        OffsetDateTime createdAt,
        String completedBy,
        OffsetDateTime completedAt) {
}
