package com.flavio.backend.service;

import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class ClusterOrchestratorService {

    private static final String SCRIPT_PATH = "/app/scripts/launch-replica.sh";

    // Nombre | Status | State | Ports | etiqueta mesh.app | etiqueta mesh.role
    private static final String PS_FORMAT =
            "{{.Names}}|{{.Status}}|{{.State}}|{{.Ports}}|{{.Label \"mesh.app\"}}|{{.Label \"mesh.role\"}}";

    public ClusterOrchestratorService() {
        System.out.println("--- [ORQUESTRADOR] Inicializado en modo Orquestación Activa ---");
    }

    public String createNewReplicaNode() throws Exception {
        ProcessBuilder pb = new ProcessBuilder("bash", SCRIPT_PATH);
        pb.redirectErrorStream(true);

        Process process = pb.start();

        // 1. Leer la salida en un hilo asíncrono para que NUNCA se llene el búfer y
        // bloquee el proceso
        StringBuilder output = new StringBuilder();
        CompletableFuture<Void> readOutput = CompletableFuture.runAsync(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            } catch (Exception ignored) {
            }
        });

        // 2. Esperar máximo 15 segundos a que el proceso script termine
        boolean finished = process.waitFor(15, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly(); // Destruir el proceso colgado
            throw new RuntimeException(
                    "Timeout (15s): El script 'launch-replica.sh' se quedó bloqueado. Salida parcial:\n" + output);
        }

        // Esperar a que el hilo de lectura termine de consumir los datos finales
        readOutput.get(2, TimeUnit.SECONDS);

        int exitCode = process.exitValue();
        if (exitCode != 0) throw new RuntimeException("Error en script (Code " + exitCode + "):\n" + output);

        return output.toString().trim();
    }

    /**
     * Consulta el estado de los contenedores del clúster utilizando el CLI de Docker
     * y devuelve una lista mapeada lista para la API REST.
     *
     * Cada elemento incluye name, status, state, port y, si el contenedor las tiene,
     * las etiquetas app (mesh.app) y role (mesh.role). Si docker falla se lanza una
     * excepción (HTTP 500 con el motivo) en vez de devolver una lista vacía.
     */
    public List<Map<String, Object>> getMonitoredContainersStatus() {
        List<Map<String, Object>> containersList = new ArrayList<>();
        List<String> unparsed = new ArrayList<>();

        try {
            ProcessBuilder processBuilder = new ProcessBuilder("docker", "ps", "-a", "--format", PS_FORMAT);
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    // -1: conserva los campos vacíos del final (etiquetas ausentes)
                    String[] parts = line.split("\\|", -1);
                    if (parts.length < 6) {
                        unparsed.add(line);
                        continue;
                    }

                    String name = parts[0];
                    String status = parts[1];
                    String state = parts[2].toLowerCase(); // running, restarting, exited, etc.
                    String ports = parts[3];
                    String app = parts[4].isBlank() ? null : parts[4].trim();
                    String role = parts[5].isBlank() ? null : parts[5].trim();

                    // Mapeamos los estados de Docker a los valores esperados por el frontend
                    String normalizedState = "stopped";
                    if (state.contains("running")) {
                        normalizedState = "running";
                    } else if (state.contains("restarting")) {
                        normalizedState = "restarting";
                    }

                    Map<String, Object> containerInfo = new HashMap<>();
                    containerInfo.put("name", name);
                    containerInfo.put("status", status);
                    containerInfo.put("state", normalizedState);
                    containerInfo.put("port", extractMainPort(ports));
                    containerInfo.put("app", app);
                    containerInfo.put("role", role);

                    containersList.add(containerInfo);
                }
            }

            int exit = process.waitFor();
            if (exit != 0 || (containersList.isEmpty() && !unparsed.isEmpty())) {
                throw new IllegalStateException(
                        "docker ps falló (exit " + exit + "): " + String.join(" / ", unparsed));
            }
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo ejecutar docker: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrumpido al consultar docker", e);
        }

        return containersList;
    }

    /**
     * Método auxiliar para extraer el puerto expuesto de forma limpia (ej. "8081")
     */
    private String extractMainPort(String portsStr) {
        if (portsStr == null || portsStr.isEmpty()) return null;
        try {
            // Busca patrón tipo 0.0.0.0:8081->8080
            if (portsStr.contains("->")) {
                String hostPart = portsStr.split("->")[0];
                if (hostPart.contains(":")) {
                    return hostPart.substring(hostPart.lastIndexOf(":") + 1);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }
}