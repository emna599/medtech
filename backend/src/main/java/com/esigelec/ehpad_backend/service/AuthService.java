package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.LoginRequest;
import com.esigelec.ehpad_backend.dto.LoginResponse;
import com.esigelec.ehpad_backend.dto.UserInfoDto;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.InvalidCredentialsException;
import com.esigelec.ehpad_backend.mapper.UserMapper;
import com.esigelec.ehpad_backend.repository.UserRepository;
import com.esigelec.ehpad_backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    // Hash BCrypt factice : comparé quand l'utilisateur n'existe pas, pour que la durée de
    // réponse ne révèle pas si un nom d'utilisateur existe.
    private static final String DUMMY_HASH = "$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        Optional<User> found = userRepository.findByUsername(request.username().trim());

        String hash = found.map(User::getPasswordHash).orElse(DUMMY_HASH);
        boolean passwordMatches = passwordEncoder.matches(request.password(), hash);

        if (found.isEmpty() || !passwordMatches || !found.get().isEnabled()) {
            throw new InvalidCredentialsException();
        }

        User user = found.get();
        return new LoginResponse(
                jwtService.generateToken(user),
                "Bearer",
                jwtService.getExpirationSeconds(),
                UserMapper.toInfo(user));
    }

    public UserInfoDto currentUser(String username) {
        return userRepository.findByUsername(username)
                .filter(User::isEnabled)
                .map(UserMapper::toInfo)
                .orElseThrow(InvalidCredentialsException::new);
    }
}
