package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.QuantityEaten;
import com.esigelec.ehpad_backend.entity.ServiceStatus;

import java.time.LocalDateTime;

/** Une ligne de travail du soignant : un repas à servir ou une prise de médicament à donner. */
public record ServiceItemDto(
        ServiceKind kind,
        Long id,
        /** Créneau : DEJEUNER, DINER... pour les repas ; MATIN, MIDI, SOIR pour les médicaments. */
        String slot,
        String label,
        String detail,
        LocalDateTime scheduledAt,
        ServiceStatus status,
        boolean highRisk,
        QuantityEaten quantityEaten,
        ResidentCardDto resident) {
}
