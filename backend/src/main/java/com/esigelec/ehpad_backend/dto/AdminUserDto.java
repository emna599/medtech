package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.Shift;

import java.time.LocalDateTime;

/** Vue d'un compte pour l'administrateur (jamais le hash du mot de passe). */
public record AdminUserDto(Long id, String username, String fullName, Role role, boolean enabled,
                           LocalDateTime createdAt, Job job, Shift shift) {
}
