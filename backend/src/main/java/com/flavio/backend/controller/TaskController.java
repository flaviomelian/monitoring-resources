package com.flavio.backend.controller;

import com.flavio.backend.dto.TaskRequestDTO;
import com.flavio.backend.model.TaskEntity;
import com.flavio.backend.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskEntity>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllActiveTasks());
    }

    @PostMapping
    public ResponseEntity<TaskEntity> createTask(@RequestBody TaskRequestDTO dto) {
        TaskEntity created = taskService.createTask(dto);
        return ResponseEntity.ok(created);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskEntity> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return taskService.updateTaskStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteService(@PathVariable Long id) {
        boolean deleted = taskService.logicalDelete(id);
        if (deleted) {
            return ResponseEntity.ok().body("Tarea eliminada lógicamente con éxito.");
        }
        return ResponseEntity.notFound().build();
    }
}