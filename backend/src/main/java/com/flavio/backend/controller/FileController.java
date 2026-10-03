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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@Tag(name = "File Controller", description = "Endpoints para la gestión, subida, descarga y eliminación lógica de ficheros con soporte de replicación")
public class FileController {

    @Autowired
    private FileService fileService;

    @Operation(summary = "Subir un fichero", description = "Sube un fichero al sistema de almacenamiento local y gestiona su replicación según los destinos especificados.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Fichero subido y replicado con éxito",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = FileResponse.class))),
        @ApiResponse(responseCode = "400", description = "Error al subir el fichero (problema de E/S)",
            content = @Content(mediaType = "text/plain", schema = @Schema(example = "Error al subir el fichero: ..."))),
        @ApiResponse(responseCode = "500", description = "Error interno durante el proceso de replicación",
            content = @Content(mediaType = "text/plain", schema = @Schema(example = "Error en la replicación: ...")))
    })
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @Parameter(description = "Fichero a subir") @RequestParam("file") MultipartFile file,
            @Parameter(description = "JSON con los destinos de replicación", example = "[\"FAN_OUT\"]") @RequestParam(value = "targets", required = false, defaultValue = "[\"FAN_OUT\"]") String targetsJson) {
        try {
            // Guardamos localmente y pasamos los targets para la replicación
            File savedFile = fileService.uploadFile(file, targetsJson);

            String fileDownloadUri = "http://localhost:8081/api/files/download/" + savedFile.getUniqueName();

            return ResponseEntity.ok(new FileResponse(savedFile.getId(), savedFile.getOriginalName(), fileDownloadUri,
                    savedFile.getFileType(), savedFile.getFileSize()));
        } catch (IOException ex) {
            return ResponseEntity.badRequest().body("Error al subir el fichero: " + ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Error en la replicación: " + ex.getMessage());
        }
    }

    @Operation(summary = "Descargar un fichero", description = "Permite descargar o visualizar un fichero almacenado a partir de su nombre único.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Fichero servido con éxito",
            content = @Content(mediaType = "application/octet-stream")),
        @ApiResponse(responseCode = "404", description = "Fichero no encontrado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(
            @Parameter(description = "Nombre único del fichero", example = "reporte_2026_xyz.pdf") @PathVariable String fileName) {
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

    @Operation(summary = "Listar ficheros activos", description = "Devuelve una lista con todos los metadatos y URIs de descarga de los ficheros activos.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de ficheros obtenida con éxito",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = FileDto.class))))
    })
    @GetMapping
    public ResponseEntity<List<FileDto>> listFiles() {
        List<File> activeFiles = fileService.getAllActiveFiles();

        List<FileDto> fileDtos = activeFiles.stream().map(file -> {
            String url = "http://localhost:8081/api/files/download/" + file.getUniqueName();
            return new FileDto(file.getId(), file.getOriginalName(), url, file.getFileSize());
        }).collect(Collectors.toList());

        return ResponseEntity.ok(fileDtos);
    }

    @Operation(summary = "Eliminación lógica de un fichero", description = "Marca un fichero como eliminado de forma lógica en la base de datos sin borrar el archivo físico.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Fichero eliminado lógicamente con éxito",
            content = @Content(mediaType = "text/plain", schema = @Schema(example = "Fichero eliminado lógicamente de la base de datos."))),
        @ApiResponse(responseCode = "404", description = "Fichero no encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> logicalDeleteFile(
            @Parameter(description = "ID único del fichero", example = "1") @PathVariable Long id) {
        boolean success = fileService.logicalDelete(id);
        if (!success) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().body("Fichero eliminado lógicamente de la base de datos.");
    }

    @Schema(description = "Respuesta detallada tras subir un fichero")
    public record FileResponse(
        @Schema(example = "1") Long id, 
        @Schema(example = "documento.pdf") String name, 
        @Schema(example = "http://localhost:8081/api/files/download/uuid_documento.pdf") String url, 
        @Schema(example = "application/pdf") String type, 
        @Schema(example = "2048") long size
    ) {}

    @Schema(description = "DTO resumido con información del fichero")
    public record FileDto(
        @Schema(example = "1") Long id, 
        @Schema(example = "documento.pdf") String name, 
        @Schema(example = "http://localhost:8081/api/files/download/uuid_documento.pdf") String url, 
        @Schema(example = "2048") long size
    ) {}
}