package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.AdminUserDto;
import com.esigelec.ehpad_backend.dto.CreateUserRequest;
import com.esigelec.ehpad_backend.dto.ResetPasswordRequest;
import com.esigelec.ehpad_backend.dto.UpdateUserRequest;
import com.esigelec.ehpad_backend.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Gestion des comptes utilisateurs. Réservé au rôle ADMIN (voir SecurityConfig). */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminUserDto> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public AdminUserDto get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserDto create(@Valid @RequestBody CreateUserRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AdminUserDto update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request,
                               Authentication authentication) {
        return service.update(id, request, authentication.getName());
    }

    @PutMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        service.resetPassword(id, request);
    }
}
