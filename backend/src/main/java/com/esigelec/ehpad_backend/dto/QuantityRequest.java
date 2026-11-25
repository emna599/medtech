package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.QuantityEaten;
import jakarta.validation.constraints.NotNull;

public record QuantityRequest(@NotNull(message = "La quantité est obligatoire") QuantityEaten quantityEaten) {
}
