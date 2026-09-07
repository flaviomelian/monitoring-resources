package com.flavio.backend.controller;

import com.flavio.backend.model.User;
import com.flavio.backend.repository.UserRepository;
import com.flavio.backend.service.AuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ApiController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    public ApiController(AuthService authService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Endpoint público de registro (crea ROLE_USER)
    @PostMapping("/auth/signup")
    public ResponseEntity<?> signup(@RequestBody RegisterRequest request) {
        try {
            User user = authService.registerUser(request.email(), request.password());
            return ResponseEntity.ok().body(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userRepository.findByEmail(request.email())
                    .orElseThrow(() -> new RuntimeException("Credenciales incorrectas."));

            if (!passwordEncoder.matches(request.password(), user.getPassword()))
                return ResponseEntity.status(401).body(new ErrorResponse("Credenciales incorrectas."));
            
            return ResponseEntity.ok(new LoginResponse(user.getRole(), "Token_Simulado_O_JWT"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    // Endpoint exclusivo para Administradores: Gestionar / Crear contenedores
    @PostMapping("/admin/containers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> manageContainers(@RequestBody ContainerActionRequest request) {
        // Lógica de Docker API para crear/administrar contenedores
        return ResponseEntity.ok("Contenedor gestionado correctamente por el Administrador.");
    }

    // Endpoint accesible por usuarios estándar y administradores: Consumir
    // servicios
    @GetMapping("/containers/consume")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<String> consumeContainers() {
        return ResponseEntity.ok("Acceso concedido al consumo de servicios y métricas.");
    }
}

// DTOs auxiliares
record RegisterRequest(String email, String password) {
}

record ContainerActionRequest(String action, String image) {
}

record ErrorResponse(String message) {
}

record LoginRequest(String email, String password) {
}

record LoginResponse(String role, String token) {
}