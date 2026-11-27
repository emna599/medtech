package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Shift;

import java.time.OffsetDateTime;

public record HandoverActionDto(
        long id,
        Long residentId,
        String residentName,
        String observation,
        String expectedAction,
        String authorName,
        OffsetDateTime createdAt,
        Long assignedTo,
        String assigneeName,
        long assignmentVersion,
        String completedBy,
        OffsetDateTime completedAt, Shift targetShift) {
}
