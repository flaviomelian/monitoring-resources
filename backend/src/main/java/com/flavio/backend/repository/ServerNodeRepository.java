package com.flavio.backend.repository;

import com.flavio.backend.model.ServerNode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerNodeRepository extends JpaRepository<ServerNode, Long> {}