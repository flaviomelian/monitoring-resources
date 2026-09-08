package com.flavio.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.flavio.backend.model.File;
import com.flavio.backend.service.FileService;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
public class FileController {

    @Autowired
    private FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Delegamos en el servicio para que guarde en disco y en la Base de Datos (JPA)
            File savedFile = fileService.uploadFile(file);

            String fileDownloadUri = "http://localhost:8081/api/files/download/" + savedFile.getUniqueName();

            return ResponseEntity.ok(new FileResponse(savedFile.getId(), savedFile.getOriginalName(), fileDownloadUri,
                    savedFile.getFileType(), savedFile.getFileSize()));
        } catch (IOException ex) {
            return ResponseEntity.badRequest().body("Error al subir el fichero: " + ex.getMessage());
        }
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Optional<File> optFile = fileService.getFileByUniqueName(fileName);
            if (optFile.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            File fileEntity = optFile.get();
            Resource resource = fileService.loadFileAsResource(fileEntity);

            String contentType = fileEntity.getFileType();
            if (contentType == null || contentType.isEmpty()) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileEntity.getOriginalName() + "\"")
                    .body(resource);

        } catch (MalformedURLException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<FileDto>> listFiles() {
        // Obtenemos los ficheros activos directamente desde la Base de Datos (JPA)
        List<File> activeFiles = fileService.getAllActiveFiles();

        List<FileDto> fileDtos = activeFiles.stream().map(file -> {
            String url = "http://localhost:8081/api/files/download/" + file.getUniqueName();
            return new FileDto(file.getId(), file.getOriginalName(), url, file.getFileSize());
        }).collect(Collectors.toList());

        return ResponseEntity.ok(fileDtos);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> logicalDeleteFile(@PathVariable Long id) {
        boolean success = fileService.logicalDelete(id);
        if (!success) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().body("Fichero eliminado lógicamente de la base de datos.");
    }

    public record FileResponse(Long id, String name, String url, String type, long size) {
    }

    public record FileDto(Long id, String name, String url, long size) {
    }
}