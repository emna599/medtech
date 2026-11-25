package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ResidentRequest(
        @NotBlank(message = "Le prénom est obligatoire")
        @Size(max = 100, message = "Prénom trop long")
        String firstName,

        @NotBlank(message = "Le nom est obligatoire")
        @Size(max = 100, message = "Nom trop long")
        String lastName,

        @NotNull(message = "La date de naissance est obligatoire")
        @Past(message = "La date de naissance doit être dans le passé")
        LocalDate birthDate,

        @NotNull(message = "La date d'admission est obligatoire")
        LocalDate admissionDate,

        /** Optionnel : un résident peut ne pas avoir encore de chambre. */
        Long roomId,

        /** Optionnel : vrai par défaut à la création. */
        Boolean active) {
}
