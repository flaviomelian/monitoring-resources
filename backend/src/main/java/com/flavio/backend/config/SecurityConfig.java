package com.flavio.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // 1. Permitir OPTIONS globalmente para CORS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 2. Permitir acceso completo a Swagger y OpenAPI
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        // 3. Tus rutas públicas habituales
                        .requestMatchers("/api/**",
                                         "/api/files",
                                         "/api/files/**", 
                                         "/api/nodes", 
                                         "/api/nodes/**",
                                         "/api/nodes/active", 
                                         "/api/auth/**", 
                                         "/api/tasks", 
                                         "/api/tasks/**", 
                                         "/terminal", 
                                         "/terminal/**", 
                                         "/error").permitAll()
                        // 4. Todo lo demás autenticado
                        .anyRequest().authenticated());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://100.127.21.61:3000",
            "http://despacho-desktop-3basi77.tail645042.ts.net:3000",
            "http://100.111.242.112:3000",
            "http://aaron-desktop.tail645042.ts.net:3000",
            "http://100.85.96.18:3000",
            "http://flavio-portatil.tail645042.ts.net:3000",
            "http://100.90.26.6:3000",
            "http://flavio-xiaomi-15.tail645042.ts.net:3000"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}