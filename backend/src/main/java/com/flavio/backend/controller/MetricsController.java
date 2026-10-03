package com.flavio.backend.controller;

import com.flavio.backend.model.ResourceMetric;
import com.flavio.backend.repository.MetricAverageProjection;
import com.flavio.backend.repository.ResourceMetricRepository;
import com.flavio.backend.service.MonitoringService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

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
@Tag(name = "Metrics Controller", description = "Endpoints para la gestión de métricas, ficheros de monitorización y transferencia entre nodos")
public class MetricsController {

    private final ResourceMetricRepository metricRepository;
    @Autowired
    private MonitoringService monitoringService;
    @Value("${STORAGE_PATH:/monitored/default}")
    private String storagePath;

    public MetricsController(ResourceMetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }

    @Operation(summary = "Obtener historial de métricas por nodo", description = "Devuelve el historial completo de métricas de recursos ordenadas cronológicamente por timestamp para un nodo específico.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Historial obtenido con éxito",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ResourceMetric.class))))
    })
    @GetMapping("/history/{nodeId}")
    public ResponseEntity<List<ResourceMetric>> getHistory(
            @Parameter(description = "ID único del nodo de servidor", example = "1") @PathVariable Long nodeId) {
        List<ResourceMetric> history = metricRepository.findByServerNodeIdOrderByTimestampAsc(nodeId);
        return ResponseEntity.ok(history);
    }

    /**
     * ENDPOINT DE INGEST (Puerto 8081)
     * El frontend de Next.js le envía el .txt aquí
     */
    @Operation(summary = "Subir archivo al ingest", description = "Recibe un archivo de texto con métricas desde el frontend e inicia el reenvío hacia la réplica.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Archivo procesado y reenviado con éxito",
            content = @Content(mediaType = "text/plain", schema = @Schema(example = "Flujo completado con éxito. Respuesta de Réplica: ...")))
    })
    @PostMapping("/ingest/upload")
    public ResponseEntity<String> uploadToIngest(
            @Parameter(description = "Archivo de texto con métricas a subir") @RequestParam("file") MultipartFile file) {
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
    @Operation(summary = "Recibir archivo en réplica", description = "Endpoint interno de la réplica que almacena el archivo recibido y procesa las métricas.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Archivo replicado y procesado correctamente",
            content = @Content(mediaType = "text/plain", schema = @Schema(example = "Archivo replicado en /monitored/default"))),
        @ApiResponse(responseCode = "500", description = "Error de escritura o procesamiento de archivos",
            content = @Content(mediaType = "text/plain", schema = @Schema(example = "Error al escribir el archivo: ...")))
    })
    @PostMapping("/replica/receive")
    public ResponseEntity<String> receiveInReplica(
            @Parameter(description = "Archivo recibido para réplica") @RequestParam("file") MultipartFile file) {
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

    @Operation(summary = "Listar archivos del ingest", description = "Devuelve una lista con los nombres de los archivos almacenados localmente en el ingest.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de archivos obtenida con éxito",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = String.class))))
    })
    @GetMapping("/ingest/files")
    public ResponseEntity<List<String>> getIngestFiles() {
        return ResponseEntity.ok(monitoringService.getLocalStoredFiles());
    }

    @Operation(summary = "Listar archivos de la réplica", description = "Devuelve una lista con los nombres de los archivos almacenados en la ruta de la réplica actual.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de archivos de réplica obtenida con éxito",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = String.class))))
    })
    @GetMapping("/replica/files")
    public ResponseEntity<List<String>> getReplicaFiles() {
        // Usamos la variable inyectada para que cada réplica liste su propia carpeta
        File folder = new File(storagePath);
        if (!folder.exists())
            folder.mkdirs();
        String[] files = folder.list();
        return ResponseEntity.ok(files != null ? Arrays.asList(files) : List.of());
    }

    @Operation(summary = "Servir archivo estático", description = "Permite acceder y descargar o visualizar en línea un archivo específico del servidor mediante su nombre.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Archivo servido con éxito",
            content = @Content(mediaType = "application/octet-stream")),
        @ApiResponse(responseCode = "404", description = "Archivo no encontrado")
    })
    @GetMapping("/file/{filename:.+}")
    public ResponseEntity<Resource> serveFile(
            @Parameter(description = "Nombre del archivo a recuperar", example = "metrics_2026.txt") @PathVariable String filename) {
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
    @Operation(summary = "Obtener medias del clúster", description = "Devuelve un consolidado con el promedio de las métricas de todos los nodos agrupadas por timestamp.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Métricas promedio obtenidas con éxito",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = MetricAverageProjection.class))))
    })
    @GetMapping("/history/average")
    public ResponseEntity<List<MetricAverageProjection>> getClusterAverageHistory() {
        // Opción limpia: delegar al servicio la agrupación y cálculo de la media por
        // timestamp
        List<MetricAverageProjection> averageMetrics = monitoringService.getClusterAverageMetrics();
        return ResponseEntity.ok(averageMetrics);
    }
}