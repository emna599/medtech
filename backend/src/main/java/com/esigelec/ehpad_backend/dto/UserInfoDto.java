package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Role;

/** Informations non sensibles d'un utilisateur (jamais le hash du mot de passe). */
public record UserInfoDto(Long id, String username, String fullName, Role role) {
}
