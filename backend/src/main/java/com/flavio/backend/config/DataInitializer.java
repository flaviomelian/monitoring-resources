package com.flavio.backend.config;

import com.flavio.backend.model.User;
import com.flavio.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "admin@dockstream.local";
            
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = User.builder()
                        .email(adminEmail)
                        .password(passwordEncoder.encode("AdminSuperSecure2026!"))
                        .role("ROLE_ADMIN")
                        .build();
                
                userRepository.save(admin);
                System.out.println(">> [Startup] Usuario administrador creado artificialmente con éxito: " + adminEmail);
            }
        };
    }
}