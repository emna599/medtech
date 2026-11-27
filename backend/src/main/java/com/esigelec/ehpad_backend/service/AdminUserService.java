package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AdminUserDto;
import com.esigelec.ehpad_backend.dto.CreateUserRequest;
import com.esigelec.ehpad_backend.dto.ResetPasswordRequest;
import com.esigelec.ehpad_backend.dto.UpdateUserRequest;
import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.Shift;
import com.esigelec.ehpad_backend.entity.StaffProfile;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.UserMapper;
import com.esigelec.ehpad_backend.repository.StaffProfileRepository;
import com.esigelec.ehpad_backend.repository.UserRepository;
import com.esigelec.ehpad_backend.security.AuthSessionStore;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionStore sessions;
    private final StaffProfileRepository profiles;
    private final StaffAssignmentService assignments;

    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthSessionStore sessions,
                            StaffProfileRepository profiles, StaffAssignmentService assignments) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
        this.profiles = profiles;
        this.assignments = assignments;
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> list() {
        Map<Long, StaffProfile> byUser = new HashMap<>();
        profiles.findAll().forEach(profile -> byUser.put(profile.getUserId(), profile));
        return userRepository.findAll().stream()
                .sorted((a, b) -> a.getUsername().compareToIgnoreCase(b.getUsername()))
                .map(user -> UserMapper.toAdmin(user, user.getRole() == Role.PERSONNEL ? byUser.get(user.getId()) : null))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUserDto get(Long id) {
        User user = find(id);
        return UserMapper.toAdmin(user, user.getRole() == Role.PERSONNEL ? profiles.findById(id).orElse(null) : null);
    }

    @Transactional
    public AdminUserDto create(CreateUserRequest request) {
        validateProfile(request.role(), request.job(), request.shift());
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
        userRepository.saveAndFlush(user);
        StaffProfile profile = request.job() == null ? null
                : profiles.save(new StaffProfile(user.getId(), request.job(), request.shift()));
        return UserMapper.toAdmin(user, profile);
    }

    /** currentUsername = l'administrateur connecté (il ne peut pas se retirer ses propres droits). */
    @Transactional
    public AdminUserDto update(Long id, UpdateUserRequest request, String currentUsername) {
        validateProfile(request.role(), request.job(), request.shift());
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
        StaffProfile profile = profiles.findById(id).orElse(null);
        boolean profileChanged = request.job() != null
                && (profile == null || profile.getJob() != request.job() || profile.getShift() != request.shift());
        if (user.getRole() != request.role() || user.isEnabled() != request.enabled() || profileChanged) {
            sessions.revokeUser(id);
        }
        if (user.getRole() != request.role() || !request.enabled()
                || (profileChanged && (profile == null || profile.getJob() != request.job()))) {
            assignments.revokeAll(id, currentUsername);
        }
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setEnabled(request.enabled());
        userRepository.saveAndFlush(user);
        if (request.role() != Role.PERSONNEL && profile != null) {
            profiles.delete(profile);
            profile = null;
        } else if (profileChanged && profile == null) {
            profile = profiles.save(new StaffProfile(id, request.job(), request.shift()));
        } else if (profileChanged) {
            profile.assign(request.job(), request.shift());
        }
        return UserMapper.toAdmin(user, profile);
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = findForUpdate(id);
        sessions.revokeUser(id);
        user.setPasswordHash(encodePassword(request.password()));
        userRepository.save(user);
    }

    private void validateProfile(Role role, Job job, Shift shift) {
        if ((job != null || shift != null) && role != Role.PERSONNEL) {
            throw new BadRequestException("La fonction et l’équipe sont réservées aux comptes Personnel");
        }
        if ((job == null) != (shift == null)) {
            throw new BadRequestException("Renseignez la fonction et l’équipe ensemble");
        }
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
