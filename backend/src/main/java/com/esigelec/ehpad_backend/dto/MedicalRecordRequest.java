package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record MedicalRecordRequest(@Size(max = 8000) String history,
                                   @Size(max = 8000) String treatments,
                                   @PositiveOrZero Long version) {}
