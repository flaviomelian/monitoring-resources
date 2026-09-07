package com.flavio.backend.service;

import com.flavio.backend.model.User;
import com.flavio.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(String email, String rawPassword) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("El correo electrónico ya está registrado.");
        }

        User newUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role("ROLE_USER") // Rol estándar por defecto
                .build();

        return userRepository.save(newUser);
    }
}