package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AdminUserDto;
import com.esigelec.ehpad_backend.dto.CreateUserRequest;
import com.esigelec.ehpad_backend.dto.ResetPasswordRequest;
import com.esigelec.ehpad_backend.dto.UpdateUserRequest;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.UserMapper;
import com.esigelec.ehpad_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setEnabled(true);
        return UserMapper.toAdmin(userRepository.saveAndFlush(user));
    }

    /** currentUsername = l'administrateur connecté (il ne peut pas se retirer ses propres droits). */
    @Transactional
    public AdminUserDto update(Long id, UpdateUserRequest request, String currentUsername) {
        User user = find(id);
        boolean isSelf = user.getUsername().equals(currentUsername);
        if (isSelf && (!request.enabled() || request.role() != Role.ADMIN)) {
            throw new ConflictException("Vous ne pouvez pas désactiver votre compte ni retirer votre rôle administrateur");
        }
        if (user.getRole() == Role.ADMIN && (request.role() != Role.ADMIN || !request.enabled())
                && userRepository.countByRoleAndEnabledTrue(Role.ADMIN) <= 1) {
            throw new ConflictException("Il doit rester au moins un administrateur actif");
        }
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setEnabled(request.enabled());
        return UserMapper.toAdmin(userRepository.saveAndFlush(user));
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = find(id);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);
    }

    private User find(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}
