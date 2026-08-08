package com.flavio.backend.controller;

import com.flavio.backend.model.ResourceMetric;
import com.flavio.backend.repository.MetricAverageProjection;
import com.flavio.backend.repository.ResourceMetricRepository;
import com.flavio.backend.service.MonitoringService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final ResourceMetricRepository metricRepository;
    @Autowired
    private MonitoringService monitoringService;
    @Value("${STORAGE_PATH:/monitored/default}")
    private String storagePath;

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
            // Usamos la variable inyectada dinámicamente
            Path directory = Paths.get(storagePath);
            if (!Files.exists(directory))
                Files.createDirectories(directory);

            Path dest = directory.resolve(file.getOriginalFilename());
            Files.write(dest, file.getBytes());

            monitoringService.saveAndProcessMetric(file);
            return ResponseEntity.ok("Archivo replicado en " + storagePath);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error al escribir el archivo: " + e.getMessage());
        }
    }

    @GetMapping("/ingest/files")
    public ResponseEntity<List<String>> getIngestFiles() {
        return ResponseEntity.ok(monitoringService.getLocalStoredFiles());
    }

    @GetMapping("/replica/files")
    public ResponseEntity<List<String>> getReplicaFiles() {
        // Usamos la variable inyectada para que cada réplica liste su propia carpeta
        File folder = new File(storagePath);
        if (!folder.exists())
            folder.mkdirs();
        String[] files = folder.list();
        return ResponseEntity.ok(files != null ? Arrays.asList(files) : List.of());
    }

    @GetMapping("/file/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        // 1. Construye la ruta donde sabes que están los archivos
        // Ojo: Ajusta la ruta base según el contenedor, ej: "/monitored/replicaX/"
        Path filePath = Paths.get("/monitored/replica3").resolve(filename);
        Resource resource = new FileSystemResource(filePath.toFile());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    /**
     * ENDPOINT GLOBAL DE MEDIAS
     * Devuelve un consolidado o la media de métricas de todos los nodos por
     * timestamp
     */
    @GetMapping("/history/average")
    public ResponseEntity<List<MetricAverageProjection>> getClusterAverageHistory() {
        // Opción limpia: delegar al servicio la agrupación y cálculo de la media por
        // timestamp
        List<MetricAverageProjection> averageMetrics = monitoringService.getClusterAverageMetrics();
        return ResponseEntity.ok(averageMetrics);
    }
}