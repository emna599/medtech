package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Le nom d'utilisateur est obligatoire")
        @Size(max = 100)
        @Pattern(regexp = "^[ A-Za-z0-9._-]+$")
        String username,
        @NotBlank(message = "Le mot de passe est obligatoire")
        @Size(max = 128)
        String password
) {
}
