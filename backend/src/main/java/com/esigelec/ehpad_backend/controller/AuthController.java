package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.LoginRequest;
import com.esigelec.ehpad_backend.dto.LoginResponse;
import com.esigelec.ehpad_backend.dto.UserInfoDto;
import com.esigelec.ehpad_backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Connexion : renvoie un jeton JWT et les informations de l'utilisateur. */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Utilisateur actuellement connecté (utile au frontend pour afficher le nom et choisir le menu). */
    @GetMapping("/me")
    public UserInfoDto me(Authentication authentication) {
        return authService.currentUser(authentication.getName());
    }
}
