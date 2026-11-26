package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "L'identifiant est obligatoire")
        @Size(min = 3, max = 100, message = "L'identifiant doit contenir entre 3 et 100 caractères")
        @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "Lettres, chiffres, point, tiret et underscore uniquement")
        String username,

        @NotBlank(message = "Le mot de passe est obligatoire")
        @Size(min = 12, max = 72, message = "Le mot de passe doit contenir entre 12 et 72 caractères")
        String password,

        @NotBlank(message = "Le nom complet est obligatoire")
        @Size(max = 150, message = "Nom trop long")
        String fullName,

        @NotNull(message = "Le rôle est obligatoire")
        Role role) {
}
