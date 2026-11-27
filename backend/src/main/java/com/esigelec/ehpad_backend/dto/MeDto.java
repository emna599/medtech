package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.Shift;

/** Le soignant connecté, avec sa fonction et ce qu'il a le droit de faire. */
public record MeDto(
        Long id,
        String username,
        String fullName,
        Role role,
        Job job,
        Shift shift,
        boolean canGiveMedication,
        boolean canEditPhotos
) {
}
