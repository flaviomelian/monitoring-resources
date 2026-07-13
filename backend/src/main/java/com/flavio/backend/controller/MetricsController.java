package com.flavio.backend.controller;

import com.flavio.backend.model.ResourceMetric;
import com.flavio.backend.repository.ResourceMetricRepository;
import com.flavio.backend.service.MonitoringService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*")
public class MetricsController {

    private final ResourceMetricRepository metricRepository;
    @Autowired
    private MonitoringService monitoringService;

    public MetricsController(ResourceMetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }

    @GetMapping("/history/{nodeId}")
    public ResponseEntity<List<ResourceMetric>> getHistory(@PathVariable Long nodeId) {
        List<ResourceMetric> history = metricRepository.findByServerNodeIdOrderByTimestampAsc(nodeId);
        return ResponseEntity.ok(history);
    }

    /**
     * ENDPOINT DE INGEST (Puerto 8081)
     * El frontend de Next.js le envía el .txt aquí
     */
    @PostMapping("/ingest/upload")
    public ResponseEntity<String> uploadToIngest(@RequestParam("file") MultipartFile file) {
        System.out.println(
                "🚀 [INGEST]: Archivo [" + file.getOriginalFilename() + "] interceptado. Chutando a la réplica...");

        // Hacemos el puente por red HTTP
        String respuestaReplica = monitoringService.forwardToReplica(file);

        return ResponseEntity.ok("Flujo completado con éxito. Respuesta de Réplica: " + respuestaReplica);
    }

    /**
     * ENDPOINT DE RÉPLICA (Puerto 8082)
     * Ingest le pega a este endpoint internamente
     */
    @PostMapping("/replica/receive")
    public ResponseEntity<String> receiveInReplica(@RequestParam("file") MultipartFile file) {
        try {
            monitoringService.saveAndProcessMetric(file);
            return ResponseEntity.ok("Métricas actualizadas e insertadas en MySQL.");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error al escribir el archivo en la Réplica: " + e.getMessage());
        }
    }

    @GetMapping("/ingest/files")
    public ResponseEntity<List<String>> getIngestFiles() {
        return ResponseEntity.ok(monitoringService.getLocalStoredFiles());
    }

    @GetMapping("/replica/files")
    public ResponseEntity<List<String>> getReplicaFiles() {
        File folder = new File("/");
        String[] files = folder.list();
        return ResponseEntity.ok(files != null ? Arrays.asList(files) : List.of());
    }
}