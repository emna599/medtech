package com.esigelec.ehpad_backend.dto;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresInSeconds,
        UserInfoDto user
) {
}
