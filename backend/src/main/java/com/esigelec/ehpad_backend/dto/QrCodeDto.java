package com.esigelec.ehpad_backend.dto;

import java.time.LocalDateTime;

public record QrCodeDto(
        Long id,
        String token,
        boolean active,
        Long residentId,
        Long userId,
        LocalDateTime createdAt,
        LocalDateTime deactivatedAt
) {
}
