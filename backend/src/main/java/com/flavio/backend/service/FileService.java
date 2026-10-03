package com.flavio.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flavio.backend.model.File;
import com.flavio.backend.repository.FileRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("No se pudo crear el directorio de almacenamiento.", ex);
        }
    }

    public File uploadFile(MultipartFile file, String targetsJson) throws IOException {
        String originalFileName = file.getOriginalFilename();
        String uniqueName = UUID.randomUUID().toString() + "_" + originalFileName;
        Path targetLocation = this.fileStorageLocation.resolve(uniqueName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        File objFile = new File();
        objFile.setOriginalName(originalFileName);
        objFile.setUniqueName(uniqueName);
        objFile.setFileType(file.getContentType());
        objFile.setFileSize(file.getSize());
        objFile.setDeleted(false);

        File savedFile = fileRepository.save(objFile);

        // Procesar la lógica de Fan-Out o envío a réplicas específicas
        try {
            List<String> targets = objectMapper.readValue(targetsJson, new TypeReference<List<String>>() {});
            propagateToReplicas(file, targets);
        } catch (Exception e) {
            System.err.println("⚠️ Error propagando a las réplicas: " + e.getMessage());
        }

        return savedFile;
    }

    private void propagateToReplicas(MultipartFile file, List<String> targets) {
        // Obtenemos los nodos activos del clúster (puedes inyectar tu servicio de clúster o consultar dinámicamente)
        // Ejemplo genérico asumiendo puertos estándar de réplicas o consultando al orquestador
        boolean isFanOut = targets.contains("FAN_OUT");

        // Ejemplo básico: si es Fan-Out o incluye nombres específicos, disparamos por HTTP multipart hacia los nodos réplica
        // Aquí puedes adaptar las URLs según la arquitectura de tu red Docker (ej. http://alpine-replica-1:8082/api/metrics/replica/upload)
        // Por simplicidad en entorno local/Tailscale:
        List<Integer> replicaPorts = List.of(8082, 8083, 8084); // O los puertos detectados en tu clúster

        for (int i = 0; i < replicaPorts.size(); i++) {
            int port = replicaPorts.get(i);
            String replicaName = "alpine-replica-" + (i + 1);

            if (isFanOut || targets.contains(replicaName)) {
                try {
                    String replicaUrl = "http://localhost:" + port + "/api/metrics/replica/upload";
                    
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                    body.add("file", file.getResource());

                    HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                    restTemplate.postForEntity(replicaUrl, requestEntity, String.class);
                    
                    System.out.println("✅ Bloque propagado exitosamente a " + replicaName + " (Port " + port + ")");
                } catch (Exception ex) {
                    System.err.println("❌ No se pudo alcanzar la réplica " + replicaName + " en el puerto " + port);
                }
            }
        }
    }

    public List<File> getAllActiveFiles() {
        return fileRepository.findByDeletedFalse();
    }

    public Optional<File> getActiveFileById(Long id) {
        return fileRepository.findByIdAndDeletedFalse(id);
    }

    public Resource loadFileAsResource(File file) throws MalformedURLException {
        Path filePath = this.fileStorageLocation.resolve(file.getUniqueName()).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) {
            return resource;
        }
        throw new RuntimeException("Fichero no encontrado en el disco en la ruta: " + filePath.toAbsolutePath());
    }

    public boolean logicalDelete(Long id) {
        Optional<File> optionalFile = fileRepository.findByIdAndDeletedFalse(id);
        if (optionalFile.isPresent()) {
            File file = optionalFile.get();
            file.setDeleted(true);
            fileRepository.save(file);
            return true;
        }
        return false;
    }

    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }

    public Optional<File> getFileByUniqueName(String uniqueName) {
        return fileRepository.findByUniqueName(uniqueName);
    }
}