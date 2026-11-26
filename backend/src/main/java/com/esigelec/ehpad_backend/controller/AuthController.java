package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.LoginRequest;
import com.esigelec.ehpad_backend.dto.LoginResponse;
import com.esigelec.ehpad_backend.dto.UserInfoDto;
import com.esigelec.ehpad_backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import com.esigelec.ehpad_backend.security.LoginThrottle;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
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
    private final LoginThrottle loginThrottle;

    public AuthController(AuthService authService, LoginThrottle loginThrottle) {
        this.authService = authService;
        this.loginThrottle = loginThrottle;
    }

    /** Connexion : renvoie un jeton JWT et les informations de l'utilisateur. */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        loginThrottle.check(httpRequest.getRemoteAddr(), request.username().trim());
        return authService.login(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        authService.logout(authorization.substring("Bearer ".length()).trim());
    }

    /** Utilisateur actuellement connecté (utile au frontend pour afficher le nom et choisir le menu). */
    @GetMapping("/me")
    public UserInfoDto me(Authentication authentication) {
        return authService.currentUser(authentication.getName());
    }
}
