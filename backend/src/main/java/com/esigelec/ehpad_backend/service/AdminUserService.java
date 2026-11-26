package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AdminUserDto;
import com.esigelec.ehpad_backend.dto.CreateUserRequest;
import com.esigelec.ehpad_backend.dto.ResetPasswordRequest;
import com.esigelec.ehpad_backend.dto.UpdateUserRequest;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.UserMapper;
import com.esigelec.ehpad_backend.repository.UserRepository;
import com.esigelec.ehpad_backend.security.AuthSessionStore;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionStore sessions;

    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthSessionStore sessions) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> list() {
        return userRepository.findAll().stream()
                .sorted((a, b) -> a.getUsername().compareToIgnoreCase(b.getUsername()))
                .map(UserMapper::toAdmin)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUserDto get(Long id) {
        return UserMapper.toAdmin(find(id));
    }

    @Transactional
    public AdminUserDto create(CreateUserRequest request) {
        String username = request.username().trim();
        if (userRepository.findByUsername(username).isPresent()) {
            throw new ConflictException("Cet identifiant est déjà utilisé");
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(encodePassword(request.password()));
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setEnabled(true);
        return UserMapper.toAdmin(userRepository.saveAndFlush(user));
    }

    /** currentUsername = l'administrateur connecté (il ne peut pas se retirer ses propres droits). */
    @Transactional
    public AdminUserDto update(Long id, UpdateUserRequest request, String currentUsername) {
        List<User> admins = userRepository.lockEnabledByRole(Role.ADMIN);
        if (admins.stream().noneMatch(admin -> admin.getUsername().equals(currentUsername))) {
            throw new AccessDeniedException("Droits administrateur révoqués");
        }
        User user = findForUpdate(id);
        boolean isSelf = user.getUsername().equals(currentUsername);
        if (isSelf && (!request.enabled() || request.role() != Role.ADMIN)) {
            throw new ConflictException("Vous ne pouvez pas désactiver votre compte ni retirer votre rôle administrateur");
        }
        if (user.getRole() == Role.ADMIN && (request.role() != Role.ADMIN || !request.enabled())
                && user.isEnabled() && admins.size() <= 1) {
            throw new ConflictException("Il doit rester au moins un administrateur actif");
        }
        if (user.getRole() != request.role() || user.isEnabled() != request.enabled()) {
            sessions.revokeUser(id);
        }
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setEnabled(request.enabled());
        return UserMapper.toAdmin(userRepository.saveAndFlush(user));
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = findForUpdate(id);
        sessions.revokeUser(id);
        user.setPasswordHash(encodePassword(request.password()));
        userRepository.save(user);
    }

    private String encodePassword(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BadRequestException("Le mot de passe ne doit pas dépasser 72 octets");
        }
        return passwordEncoder.encode(password);
    }

    private User findForUpdate(Long id) {
        return userRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private User find(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}
