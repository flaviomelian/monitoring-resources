package com.flavio.backend.repository;

import com.flavio.backend.model.ServerNode;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerNodeRepository extends JpaRepository<ServerNode, Long> {
    Optional<ServerNode> findByName(String name);
}