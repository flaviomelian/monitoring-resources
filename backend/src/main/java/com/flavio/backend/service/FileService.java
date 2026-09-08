package com.flavio.backend.service;

import com.flavio.backend.model.File;
import com.flavio.backend.repository.FileRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
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
import java.util.stream.Collectors;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("No se pudo crear el directorio de almacenamiento.", ex);
        }
    }

    public File uploadFile(MultipartFile file) throws IOException {
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

        return fileRepository.save(objFile);
    }

    public List<File> getAllActiveFiles() {
        return fileRepository.findByDeletedFalse();
    }

    public Optional<File> getActiveFileById(Long id) {
        return fileRepository.findByIdAndDeletedFalse(id);
    }

    public Resource loadFileAsResource(File file) throws MalformedURLException {
        Path filePath = this.fileStorageLocation.resolve(file.getUniqueName()).normalize();

        // Trazas de depuración críticas
        System.out.println("----------------------------------------");
        System.out.println("Directorio base configurado: " + this.fileStorageLocation);
        System.out.println("Nombre único buscado: " + file.getUniqueName());
        System.out.println("Ruta absoluta calculada: " + filePath.toAbsolutePath());
        System.out.println("¿Existe físicamente en el disco?: " + Files.exists(filePath));
        System.out.println("----------------------------------------");

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