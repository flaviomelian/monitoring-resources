package com.flavio.backend.service;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;

@Service
public class DeploymentService {

    public String deployMicroservice(String projectPath) {
        StringBuilder output = new StringBuilder();
        try {
            File workingDir = new File(projectPath);
            
            // Comando para levantar el compose apuntando al socket del host desde el contenedor ingest
            ProcessBuilder processBuilder = new ProcessBuilder("docker", "compose", "up", "-d", "--build");
            processBuilder.directory(workingDir);
            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("Error en el despliegue del microservicio. Código: " + exitCode);
            }
            
        } catch (Exception e) {
            return "Fallo al desplegar: " + e.getMessage();
        }
        return "Despliegue exitoso:\n" + output.toString();
    }
}