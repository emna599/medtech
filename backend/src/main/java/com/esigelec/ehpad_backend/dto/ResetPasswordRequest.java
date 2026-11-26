package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Le mot de passe est obligatoire")
        @Size(min = 12, max = 72, message = "Le mot de passe doit contenir entre 12 et 72 caractères")
        String password) {
}
