package com.flavio.backend.controller;

import com.flavio.backend.model.ServerNode;
import com.flavio.backend.repository.ServerNodeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/nodes")
public class ServerNodeController {

    private final ServerNodeRepository serverNodeRepository;

    public ServerNodeController(ServerNodeRepository serverNodeRepository) {
        this.serverNodeRepository = serverNodeRepository;
    }

    @GetMapping
    public List<ServerNode> getAllNodes() {
        return serverNodeRepository.findAll();
    }
}