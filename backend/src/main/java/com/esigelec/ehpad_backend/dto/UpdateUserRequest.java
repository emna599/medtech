package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank(message = "Le nom complet est obligatoire")
        @Size(max = 150, message = "Nom trop long")
        String fullName,

        @NotNull(message = "Le rôle est obligatoire")
        Role role,

        @NotNull(message = "L'état du compte est obligatoire")
        Boolean enabled) {
}
