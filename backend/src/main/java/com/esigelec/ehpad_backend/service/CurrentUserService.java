package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.InvalidCredentialsException;
import com.esigelec.ehpad_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

/** Retrouve le soignant connecté à partir de son nom d'utilisateur (jamais fourni par le frontend). */
@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User require(String username) {
        return userRepository.findByUsername(username)
                .filter(User::isEnabled)
                .orElseThrow(InvalidCredentialsException::new);
    }
}
