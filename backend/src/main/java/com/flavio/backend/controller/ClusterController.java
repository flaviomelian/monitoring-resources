package com.flavio.backend.controller;

import com.flavio.backend.service.ClusterOrchestratorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cluster")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*")
public class ClusterController {

    private final ClusterOrchestratorService orchestratorService;

    public ClusterController(ClusterOrchestratorService orchestratorService) {
        this.orchestratorService = orchestratorService;
    }

    @PostMapping("/scale-up")
    public ResponseEntity<String> scaleUp() {
        System.out.println("LLEGUE AL PUTO ENDPOINT"); //ESTO NO SE VE
        try {
            String result = orchestratorService.createNewReplicaNode();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("===========================ERROR=========================");
            e.printStackTrace();
            System.out.println("===========================ERROR=========================");
            return ResponseEntity.status(500).body("Error al escalar el clúster: " + e.getMessage());
        }
    }
}
