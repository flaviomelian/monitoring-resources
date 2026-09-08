package com.flavio.backend.repository;

import com.flavio.backend.model.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<TaskEntity, Long> {
    List<TaskEntity> findByDeletedFalse();
    Optional<TaskEntity> findByIdAndDeletedFalse(Long id);
}