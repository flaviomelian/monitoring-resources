package com.flavio.backend.controller;

import com.flavio.backend.model.User;
import com.flavio.backend.repository.UserRepository;
import com.flavio.backend.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "API Controller", description = "Endpoints de autenticación, gestión de contenedores y consumo de servicios")
public class ApiController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    public ApiController(AuthService authService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Operation(summary = "Registro de usuario", description = "Crea un nuevo usuario estándar con rol ROLE_USER.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuario registrado con éxito", 
            content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "400", description = "Error de validación o el usuario ya existe", 
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/auth/signup")
    public ResponseEntity<?> signup(@RequestBody RegisterRequest request) {
        try {
            User user = authService.registerUser(request.email(), request.password());
            return ResponseEntity.ok().body(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @Operation(summary = "Inicio de sesión", description = "Valida las credenciales del usuario y devuelve un token de acceso.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login correcto", 
            content = @Content(schema = @Schema(implementation = LoginResponse.class))),
        @ApiResponse(responseCode = "401", description = "Credenciales incorrectas", 
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
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

    @Operation(
        summary = "Gestionar contenedores (Admin)", 
        description = "Endpoint exclusivo para administradores para crear o administrar contenedores Docker.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contenedor gestionado correctamente"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado (Requiere ROLE_ADMIN)")
    })
    @PostMapping("/admin/containers")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<String> manageContainers(@RequestBody ContainerActionRequest request) {
        return ResponseEntity.ok("Contenedor gestionado correctamente por el Administrador.");
    }

    @Operation(
        summary = "Consumir servicios", 
        description = "Permite a usuarios estándar y administradores consumir servicios y métricas de contenedores.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Acceso concedido"),
        @ApiResponse(responseCode = "403", description = "Acceso no autorizado")
    })
    @GetMapping("/containers/consume")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<String> consumeContainers() {
        return ResponseEntity.ok("Acceso concedido al consumo de servicios y métricas.");
    }
}

// DTOs auxiliares documentados
@Schema(description = "Datos para el registro de un nuevo usuario")
record RegisterRequest(
    @Schema(example = "usuario@email.com") String email, 
    @Schema(example = "password123") String password
) {}

@Schema(description = "Datos para la acción sobre un contenedor")
record ContainerActionRequest(
    @Schema(example = "start") String action, 
    @Schema(example = "ubuntu:latest") String image
) {}

@Schema(description = "Estructura estándar de respuesta de error")
record ErrorResponse(
    @Schema(example = "Mensaje descriptivo del error") String message
) {}

@Schema(description = "Credenciales de inicio de sesión")
record LoginRequest(
    @Schema(example = "usuario@email.com") String email, 
    @Schema(example = "password123") String password
) {}

@Schema(description = "Respuesta exitosa del login con rol y token")
record LoginResponse(
    @Schema(example = "ROLE_USER") String role, 
    @Schema(example = "eyJhbGciOiJIUzI1Ni..." ) String token
) {}