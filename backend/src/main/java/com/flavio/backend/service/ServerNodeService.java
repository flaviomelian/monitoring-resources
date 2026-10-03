package com.flavio.backend.service;

import com.flavio.backend.model.ServerNode;
import com.flavio.backend.repository.ServerNodeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServerNodeService {

    private final ServerNodeRepository serverNodeRepository;

    public ServerNodeService(ServerNodeRepository serverNodeRepository) {
        this.serverNodeRepository = serverNodeRepository;
    }

    public List<ServerNode> getAllNodes() {
        return serverNodeRepository.findAll();
    }

    public List<ServerNode> getActiveNodes() {
        return serverNodeRepository.findByIsActiveTrue();
    }
}