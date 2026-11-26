package com.esigelec.ehpad_backend.dto;

import java.time.LocalDateTime;

public record NoteDto(
        Long id,
        String content,
        String category,
        LocalDateTime createdAt,
        String authorName,
        String authorJob,
        ResidentRef resident
) {

    public record ResidentRef(Long id, String name, String room) {
    }
}
