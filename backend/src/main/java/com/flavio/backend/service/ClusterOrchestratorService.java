package com.flavio.backend.service;

import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.stream.Collectors;

@Service
public class ClusterOrchestratorService {

    // Ruta donde dejamos el script dentro del contenedor en el Dockerfile
    private static final String SCRIPT_PATH = "/app/scripts/launch-replica.sh";

    public ClusterOrchestratorService() {
        System.out.println("--- [ORQUESTRADOR] Inicializado en modo Orquestación SSH Activa ---");
    }

    /**
     * Levanta un nuevo nodo réplica en caliente en el clúster ejecutando el script por SSH.
     */
    public synchronized String createNewReplicaNode() {
        System.out.println("ESTOY EN createNewReplicaNode() - Disparando ejecución SSH...");

        try {
            // Creamos el proceso para ejecutar el script de Bash
            ProcessBuilder processBuilder = new ProcessBuilder("bash", SCRIPT_PATH);
            processBuilder.redirectErrorStream(true); // Redirige errores a la salida estándar

            Process process = processBuilder.start();

            // Leemos la salida generada por nuestro script de bash para registrarla en Spring
            String output;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                output = reader.lines().collect(Collectors.joining("\n"));
            }

            // Esperamos a que el proceso termine y obtenemos el código de salida
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                System.out.println("--- [SSH OK] Salida del script:\n" + output);
                return "Nodo réplica levantado con éxito a través de SSH en el Host.";
            } else {
                System.err.println("--- [SSH ERROR] El script falló con código " + exitCode + ". Salida:\n" + output);
                throw new RuntimeException("El script de SSH devolvió un código de error: " + exitCode);
            }

        } catch (Exception e) {
            throw new RuntimeException("Error al ejecutar el script de orquestación por SSH: " + e.getMessage(), e);
        }
    }
}