package com.flavio.backend.service;

import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class ClusterOrchestratorService {

    private static final String SCRIPT_PATH = "/app/scripts/launch-replica.sh";

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
}