package com.flavio.backend.controller;

import com.flavio.backend.dto.TaskRequestDTO;
import com.flavio.backend.model.TaskEntity;
import com.flavio.backend.service.TaskService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@Tag(name = "Task Controller", description = "Endpoints para la gestión, consulta y actualización de tareas")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @Operation(summary = "Obtener todas las tareas activas", description = "Devuelve una lista con todas las tareas que se encuentran activas en el sistema.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de tareas obtenida con éxito",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = TaskEntity.class))))
    })
    @GetMapping
    public ResponseEntity<List<TaskEntity>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllActiveTasks());
    }

    @Operation(summary = "Crear una nueva tarea", description = "Registra y crea una tarea nueva a partir de los datos proporcionados.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tarea creada correctamente",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = TaskEntity.class))),
        @ApiResponse(responseCode = "400", description = "Datos de entrada incorrectos o inválidos")
    })
    @PostMapping
    public ResponseEntity<TaskEntity> createTask(@RequestBody TaskRequestDTO dto) {
        TaskEntity created = taskService.createTask(dto);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Actualizar estado de una tarea", description = "Modifica el estado actual de una tarea específica identificada por su ID.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estado de la tarea actualizado con éxito",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = TaskEntity.class))),
        @ApiResponse(responseCode = "404", description = "Tarea no encontrada con el ID proporcionado")
    })
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskEntity> updateStatus(
            @Parameter(description = "ID único de la tarea", example = "1") @PathVariable Long id, 
            @Parameter(description = "Nuevo estado a asignar", example = "COMPLETED") @RequestParam String status) {
        return taskService.updateTaskStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Eliminación lógica de una tarea", description = "Realiza un borrado lógico de una tarea específica sin eliminarla físicamente de la base de datos.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tarea eliminada lógicamente con éxito",
            content = @Content(mediaType = "text/plain", schema = @Schema(example = "Tarea eliminada lógicamente con éxito."))),
        @ApiResponse(responseCode = "404", description = "Tarea no encontrada con el ID proporcionado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteService(
            @Parameter(description = "ID único de la tarea a eliminar", example = "1") @PathVariable Long id) {
        boolean deleted = taskService.logicalDelete(id);
        if (deleted) {
            return ResponseEntity.ok().body("Tarea eliminada lógicamente con éxito.");
        }
        return ResponseEntity.notFound().build();
    }
}