package com.flavio.backend.controller;

import com.flavio.backend.service.ClusterOrchestratorService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/cluster")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*")
public class ClusterController {

    private final ClusterOrchestratorService orchestratorService;
    private final Path logFilePath;
    private final Path errorFilePath;
    private final String portsFilePath;

    public ClusterController(
            ClusterOrchestratorService orchestratorService,
            @Value("${cluster.log.path:logs/cluster_logs.txt}") String logPath,
            @Value("${cluster.log.path:logs/error_logs.txt}") String errorPath,
            @Value("${cluster.ports.path:logs/ports.txt}") String portsPath) {
        this.orchestratorService = orchestratorService;
        this.logFilePath = Paths.get(logPath);
        this.errorFilePath = Paths.get(errorPath);
        this.portsFilePath = portsPath;
    }

    @PostMapping("/scale-up")
    public ResponseEntity<String> scaleUp() {
        try {
            String result = orchestratorService.createNewReplicaNode();

            String logEntry = String.format("[%s] Scale-up ejecutado con éxito: %s%n", LocalDateTime.now(), result);
            System.out.println(logEntry);
            writeToLog(logEntry, false);
            writeNewPort();

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("=========================== ERROR EN SCALE-UP =========================");
            e.printStackTrace();
            System.err.println("=======================================================================");

            String errorEntry = String.format("[%s] ERROR en scale-up: %s%n", LocalDateTime.now(), e.getMessage());
            writeToLog("\n" + errorEntry, true);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al escalar el clúster: " + e.getMessage());
        }
    }

    @GetMapping(value = "/logs", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<String>> getLogs() {
        try {
            // Si es un directorio por algún error residual, se bloquea explícitamente
            if (Files.exists(logFilePath) && Files.isDirectory(logFilePath)) {
                System.err.println("❌ ERROR: " + logFilePath.toAbsolutePath() + " es un directorio.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(List.of(
                                "Error: La ruta configurada apunta a un directorio en lugar de a un archivo de logs."));
            }

            // Si el archivo aún no se ha creado (0 ejecuciones), devuelve lista vacía sin
            // dar 500
            if (Files.notExists(logFilePath))
                return ResponseEntity.ok(Collections.emptyList());

            List<String> lines = Files.readAllLines(logFilePath);
            System.out.println("--------------------------------------se leyó todo: " + lines
                    + "--------------------------------------");
            return ResponseEntity.ok(lines);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    @GetMapping(value = "/nodes", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<String>> getNodes() {
        File portsFile = new File(this.portsFilePath);

        // 1. Control de seguridad: Si la ruta es un directorio
        if (portsFile.exists() && portsFile.isDirectory()) {
            System.err.println("❌ ERROR: " + portsFile.getAbsolutePath() + " es un directorio.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of("Error: La ruta configurada apunta a un directorio."));
        }

        // 2. Si no existe el archivo todavía, devolvemos 200 OK con lista vacía
        if (!portsFile.exists()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        try {
            // 3. Leemos todas las líneas, limpiamos espacios y descartamos líneas vacías
            List<String> puertos = Files.readAllLines(portsFile.toPath())
                    .stream()
                    .map(String::trim)
                    .filter(linea -> !linea.isEmpty())
                    .toList();

            // LOG de depuración
            System.out.println("-------------------------------------- Puertos leídos: " + puertos
                    + " --------------------------------------");

            // OPCIÓN A: Si el Frontend espera directamente las URLs internas del contenedor
            // Docker
            // Ejemplo: Convierte el puerto 8084 ->
            // "http://monitoring-resources-alpine-replica-3:8080"
            /*
             * List<String> nodos = puertos.stream()
             * .map(puerto -> {
             * int numReplica = Integer.parseInt(puerto) - 8081;
             * return "http://monitoring-resources-alpine-replica-" + numReplica + ":8080";
             * })
             * .toList();
             * return ResponseEntity.ok(nodos);
             */

            // OPCIÓN B: Si el Frontend o cliente accede desde fuera vía localhost/host
            // Ejemplo: Convierte el puerto 8084 -> "http://localhost:8084"
            List<String> nodos = puertos.stream()
                    .map(puerto -> "http://localhost:" + puerto)
                    .toList();

            return ResponseEntity.ok(nodos);

        } catch (IOException e) {
            System.err.println("❌ Error al leer el archivo de puertos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    /**
     * Garantiza la existencia de la carpeta contenedora antes de escribir el
     * archivo de log.
     */
    private synchronized void writeToLog(String content, boolean error) {
        try {
            Path parentDir = logFilePath.getParent();
            if (parentDir != null && Files.notExists(parentDir))
                Files.createDirectories(parentDir);

            if (error)
                Files.writeString(
                        errorFilePath,
                        content,
                        StandardOpenOption.CREATE,
                        StandardOpenOption.APPEND);
            else
                Files.writeString(
                        logFilePath,
                        content,
                        StandardOpenOption.CREATE,
                        StandardOpenOption.APPEND);

        } catch (IOException e) {
            System.err.println("❌ Error de I/O al escribir en el archivo de log: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void writeNewPort() {
        File file = new File(this.portsFilePath);

        try (RandomAccessFile raf = new RandomAccessFile(file, "rw")) {
            long pos = raf.length() - 1;

            // 1. Ignorar saltos de línea colgados al final
            while (pos >= 0) {
                raf.seek(pos);
                byte b = raf.readByte(); // Leer solo UNA VEZ por iteración
                if (b != '\n' && b != '\r') {
                    break;
                }
                pos--;
            }

            // 2. Retroceder hasta dar con el salto de línea anterior
            while (pos >= 0) {
                raf.seek(pos);
                byte b = raf.readByte(); // Leer solo UNA VEZ por iteración
                if (b == '\n') {
                    break;
                }
                pos--;
            }

            // 3. Posicionar al inicio del último número y leerlo
            if (pos < 0) {
                raf.seek(0);
            } else {
                raf.seek(pos + 1);
            }

            String ultimaLinea = raf.readLine();
            int ultimoPuerto = (ultimaLinea != null && !ultimaLinea.trim().isEmpty())
                    ? Integer.parseInt(ultimaLinea.trim())
                    : 8081;
            int nuevoPuerto = ultimoPuerto + 1;

            // 4. Ir al final absoluto del archivo y escribir el salto + puerto nuevo
            raf.seek(raf.length());
            String dataToWrite = (raf.length() > 0 ? "\n" : "") + nuevoPuerto;
            raf.writeBytes(dataToWrite);

            System.out.println("Nuevo puerto registrado: " + nuevoPuerto);

        } catch (IOException | NumberFormatException e) {
            System.err.println("Error al procesar el archivo de puertos: "
                    + (e.getMessage() != null ? e.getMessage() : e.getClass().getName()));
        }
    }
}