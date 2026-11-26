package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.NoteCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** `residentId` et `category` sont facultatifs (par défaut : note générale de traçabilité). */
public record NoteRequest(
        @NotBlank @Size(max = 1000) String content,
        Long residentId,
        NoteCategory category
) {
}
