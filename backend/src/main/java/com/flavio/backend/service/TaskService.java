package com.flavio.backend.service;

import com.flavio.backend.dto.TaskRequestDTO;
import com.flavio.backend.model.TaskEntity;
import com.flavio.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskEntity> getAllActiveTasks() {
        return taskRepository.findByDeletedFalse();
    }

    public TaskEntity createTask(TaskRequestDTO dto) {
        TaskEntity task = new TaskEntity();
        task.setTitle(dto.getTitle());
        task.setStatus(dto.getStatus() != null && !dto.getStatus().isEmpty() ? dto.getStatus() : "todo");
        task.setPriority(dto.getPriority() != null && !dto.getPriority().isEmpty() ? dto.getPriority() : "medium");
        task.setTag(dto.getTag() != null && !dto.getTag().isEmpty() ? dto.getTag() : "General");
        task.setDeleted(false);
        
        return taskRepository.save(task);
    }

    public Optional<TaskEntity> updateTaskStatus(Long id, String status) {
        Optional<TaskEntity> optionalTask = taskRepository.findByIdAndDeletedFalse(id);
        if (optionalTask.isPresent()) {
            TaskEntity task = optionalTask.get();
            task.setStatus(status);
            return Optional.of(taskRepository.save(task));
        }
        return Optional.empty();
    }

    public boolean logicalDelete(Long id) {
        Optional<TaskEntity> optionalTask = taskRepository.findByIdAndDeletedFalse(id);
        if (optionalTask.isPresent()) {
            TaskEntity task = optionalTask.get();
            task.setDeleted(true);
            taskRepository.save(task);
            return true;
        }
        return false;
    }
}