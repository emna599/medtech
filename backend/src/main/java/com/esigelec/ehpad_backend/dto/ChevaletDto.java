package com.esigelec.ehpad_backend.dto;

import java.time.LocalDateTime;

public record ChevaletDto(Long id, String code, Long residentId, String residentName, LocalDateTime associatedAt) {
}
