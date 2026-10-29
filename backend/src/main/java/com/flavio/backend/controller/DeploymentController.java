package com.flavio.backend.controller;

import com.flavio.backend.service.ZipExtractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {

    private final ZipExtractionService zipExtractionService;

    public DeploymentController(ZipExtractionService zipExtractionService) {
        this.zipExtractionService = zipExtractionService;
    }

    // Endpoint para descomprimir un ZIP y desplegarlo automáticamente
    // Ejemplo: POST /api/deployments/extract-and-run?zipPath=/monitored/replica2/logpulse.zip&targetPath=/monitored/replica2/logpulse
    @PostMapping("/extract-and-run")
    public ResponseEntity<String> extractAndDeploy(
            @RequestParam String zipPath, 
            @RequestParam String targetPath) {
        System.out.println("--- PETICION RECIBIDA ---");
        String result = zipExtractionService.extractAndDeploy(zipPath, targetPath);
        return ResponseEntity.ok(result);
    }
}