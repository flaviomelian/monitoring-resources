package com.flavio.backend.service;

import org.springframework.stereotype.Service;
import java.io.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class ZipExtractionService {

    private final DeploymentService deploymentService;

    public ZipExtractionService(DeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    public String extractAndDeploy(String zipFilePath, String outputDirStr) {
        File destDir = new File(outputDirStr);
        if (!destDir.exists()) {
            destDir.mkdirs();
        }

        // 1. Descomprimir el archivo ZIP
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFilePath))) {
            ZipEntry zipEntry = zis.getNextEntry();
            while (zipEntry != null) {
                File newFile = new File(destDir, zipEntry.getName());
                
                // Seguridad contra Path Traversal
                String destDirPath = destDir.getCanonicalPath();
                String destFilePath = newFile.getCanonicalPath();
                if (!destFilePath.startsWith(destDirPath + File.separator)) {
                    throw new IOException("Entrada ZIP fuera del directorio de destino: " + zipEntry.getName());
                }

                if (zipEntry.isDirectory()) {
                    if (!newFile.isDirectory() && !newFile.mkdirs()) {
                        throw new IOException("Fallo al crear el directorio: " + newFile);
                    }
                } else {
                    // Asegurar que las carpetas padre existan
                    File parent = newFile.getParentFile();
                    if (!parent.isDirectory() && !parent.mkdirs()) {
                        throw new IOException("Fallo al crear el directorio padre: " + parent);
                    }

                    // Escribir el fichero descomprimido
                    try (FileOutputStream fos = new FileOutputStream(newFile)) {
                        byte[] bytes = new byte[4096];
                        int length;
                        while ((length = zis.read(bytes)) > 0) {
                            fos.write(bytes, 0, length);
                        }
                    }
                }
                zipEntry = zis.getNextEntry();
            }
            zis.closeEntry();
        } catch (IOException e) {
            return "Fallo al descomprimir el ZIP: " + e.getMessage();
        }

        // 2. Verificar que existe el docker-compose.yml en la carpeta extraída
        File composeFile = new File(destDir, "docker-compose.yml");
        if (!composeFile.exists()) {
            return "Extracción completada, pero no se encontró un 'docker-compose.yml' en la raíz del proyecto.";
        }

        // 3. Lanzar el despliegue automáticamente
        return deploymentService.deployMicroservice(destDir.getAbsolutePath());
    }
}