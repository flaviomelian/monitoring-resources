package com.flavio.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sites")
@Tag(name = "Sites Controller", description = "Endpoints para listar y descubrir aplicaciones web estáticas en los volúmenes del clúster")
public class SiteController {

    private final String storageRoot;
    private static final Pattern NODE_PATTERN = Pattern.compile("^(ingest|replica\\d+)$");

    public SiteController(@Value("${cluster.storage.path:/monitored}") String storageRoot) {
        this.storageRoot = storageRoot;
    }

    @Operation(summary = "Listar proyectos web por nodo físico", description = "Escanea el volumen físico del nodo (ej: /monitored/replica1) buscando carpetas con un index.html")
    @GetMapping("/{node}")
    public ResponseEntity<List<Map<String, String>>> listSitesForNode(@PathVariable String node) {
        try {

            if (!NODE_PATTERN.matcher(node).matches())
                return ResponseEntity.badRequest().build();

            Path nodePath = Paths.get(storageRoot, node).normalize();
            System.out.println("🔍 [DEBUG] Buscando nodo en ruta absoluta: " + nodePath.toAbsolutePath());
            System.out.println("🔍 [DEBUG] ¿Existe la ruta?: " + Files.exists(nodePath) + " | ¿Es directorio?: "
                    + Files.isDirectory(nodePath));

            if (!Files.exists(nodePath) || !Files.isDirectory(nodePath)) {
                System.out.println("❌ [DEBUG] La ruta falló la validación física en Java para el nodo: " + node);
                return ResponseEntity.ok(Collections.emptyList());
            }

            // Escanea subcarpetas que contengan un archivo index.html
            List<Map<String, String>> sites = Files.list(nodePath)
                    .filter(Files::isDirectory)
                    .filter(path -> Files.exists(path.resolve("index.html")))
                    .map(path -> {
                        String folderName = path.getFileName().toString();
                        Map<String, String> site = new HashMap<>();
                        site.put("name", folderName);
                        site.put("path", node + "/" + folderName);
                        return site;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(sites);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}