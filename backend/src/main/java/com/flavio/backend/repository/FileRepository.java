package com.flavio.backend.repository;

import com.flavio.backend.model.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<File, Long> {
    List<File> findByDeletedFalse();
    Optional<File> findByIdAndDeletedFalse(Long id);
}