package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Question posée à l'assistant, en français courant. */
public record AssistantRequest(
        @NotBlank(message = "La question est obligatoire") @Size(max = 300, message = "300 caractères maximum") String message) {
}
