package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Shift;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record HandoverRequest(
        @NotNull UUID requestId,
        @Positive Long residentId,
        @NotBlank @Size(max = 1200) String observation,
        @NotBlank @Size(max = 400) String expectedAction, Shift targetShift) {
}
