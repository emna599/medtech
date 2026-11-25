package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.MealLocation;
import jakarta.validation.constraints.NotNull;

public record LocationRequest(@NotNull(message = "Le lieu est obligatoire") MealLocation mealLocation) {
}
