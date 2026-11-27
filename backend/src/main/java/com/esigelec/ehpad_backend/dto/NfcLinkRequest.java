package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Associe une carte ou un bracelet NFC (son numéro de série ou son texte) à un résident. */
public record NfcLinkRequest(@NotBlank(message = "Le code de la carte est obligatoire") @Size(max = 100) String token) {
}
