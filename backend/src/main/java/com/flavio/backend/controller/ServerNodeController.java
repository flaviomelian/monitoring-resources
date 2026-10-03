package com.flavio.backend.controller;

import com.flavio.backend.model.ServerNode;
import com.flavio.backend.service.ServerNodeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/nodes")
@Tag(name = "Server Node Controller", description = "Endpoints para la consulta y gestión de nodos de servidor")
public class ServerNodeController {

    private final ServerNodeService serverNodeService;

    public ServerNodeController(ServerNodeService serverNodeService) {
        this.serverNodeService = serverNodeService;
    }

    @Operation(summary = "Obtener todos los nodos", description = "Devuelve una lista con todos los nodos de servidor registrados en el sistema.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de nodos obtenida con éxito",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ServerNode.class))))
    })
    @GetMapping
    public List<ServerNode> getAllNodes() {
        return serverNodeService.getAllNodes();
    }

    @Operation(summary = "Obtener solo nodos activos", description = "Devuelve una lista únicamente con los nodos de servidor que se encuentran activos en el sistema.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de nodos activos obtenida con éxito",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ServerNode.class))))
    })
    @GetMapping("/active")
    public List<ServerNode> getActiveNodes() {
        return serverNodeService.getActiveNodes();
    }
}