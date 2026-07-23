package com.flavio.backend.service;

import com.flavio.backend.model.ResourceMetric;
import com.flavio.backend.model.ServerNode;
import com.flavio.backend.repository.ResourceMetricRepository;
import com.flavio.backend.repository.ServerNodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.lang.management.ManagementFactory;
import com.sun.management.OperatingSystemMXBean;

import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;

@Service
public class MonitoringService {

    @Autowired
    private ServerNodeRepository nodeRepository;

    @Autowired
    private ResourceMetricRepository metricRepository;

    private ResourceMetric lastSavedMetric = null;

    // 1. Inyectamos las URLs como una lista separada por comas desde el entorno o
    // un fallback
    @Value("#{'${cluster.replicas.urls:http://localhost:8082}'.split(',')}")
    private List<String> replicaUrls;

    // 2. Ruta dinámica de disco independiente para cada contenedor
    @Value("${cluster.storage.path:/monitored/ingest}")
    private String clusterStoragePath;

    private List<WebClient> webClients = new ArrayList<>();

    @PostConstruct
    public void initWebClients() {
        System.out.println("🔧 [CLUSTER] Inicializando puentes HTTP del sistema de respaldo...");
        for (String url : replicaUrls) {
            if (!url.isBlank()) {
                System.out.println("🔗 Nodo réplica registrado: " + url.trim());
                webClients.add(WebClient.builder().baseUrl(url.trim()).build());
            }
        }
    }

    public String forwardToReplica(MultipartFile file) {
        try {
            System.out.println("⏳ [INGEST] Reteniendo bloque 2 segundos simulando latencia de red de respaldo...");
            Thread.sleep(2000);

            byte[] fileBytes = file.getBytes();
            // Garantizamos que nunca sea null para evitar que el multipart pierda la
            // cabecera Content-Disposition
            String filename = (file.getOriginalFilename() != null && !file.getOriginalFilename().isBlank())
                    ? file.getOriginalFilename()
                    : "block_data.bin";

            if (webClients.isEmpty()) {
                System.out.println("⚠️ [INGEST] No hay nodos de réplica configurados en el clúster.");
                return "No hay réplicas activas para sincronizar.";
            }

            System.out.println("🚀 [INGEST] Disparando réplicas concurrentemente a " + webClients.size() + " nodos...");

            // Usamos un Resource con soporte estricto de Multipart
            ByteArrayResource fileAsResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            reactor.core.publisher.Flux.fromIterable(webClients)
                    .flatMap(client -> {
                        // Construimos el mapa multipart
                        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                        body.add("file", fileAsResource);

                        return client.post()
                                .uri("/api/metrics/replica/receive")
                                .contentType(MediaType.MULTIPART_FORM_DATA)
                                .body(org.springframework.web.reactive.function.BodyInserters.fromMultipartData(body))
                                .retrieve()
                                .bodyToMono(String.class)
                                .doOnSuccess(res -> System.out
                                        .println("✅ Bloque enviado con éxito a réplica. Respuesta: " + res))
                                .onErrorResume(err -> {
                                    System.err.println("❌ Error al replicar en nodo: " + err.getMessage());
                                    return Mono.just("❌ Fallo en nodo");
                                });
                    })
                    .collectList()
                    .block();

            System.out.println("✅ [INGEST] Sincronización del clúster completada con éxito.");
            return "Sincronización del clúster completada.";

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("❌ Simulación interrumpida", e);
        } catch (Exception e) {
            System.err.println("❌ Falló el catch del pipeline: " + e.getMessage());
            throw new RuntimeException("❌ Fallo en el pipeline distribuido: " + e.getMessage());
        }
    }

    /**
     * LÓGICA DE RÉPLICA: Guarda el archivo físicamente en su volumen exclusivo
     */
    public void saveAndProcessMetric(MultipartFile file) throws IOException {
        // Aseguramos que el directorio exista antes de escribir
        File directory = new File(clusterStoragePath);
        if (!directory.exists())
            directory.mkdirs();

        String targetPath = clusterStoragePath + "/" + file.getOriginalFilename();
        try (FileOutputStream fos = new FileOutputStream(targetPath)) {
            fos.write(file.getBytes());
        }
        System.out.println(
                "📥 [ALMACENAMIENTO] Archivo [" + file.getOriginalFilename() + "] consolidado en: " + targetPath);

        forceMetricsCollection();
    }

    private void forceMetricsCollection() {
        ServerNode mainNode = nodeRepository.findAll().stream().findFirst().orElseGet(() -> {
            ServerNode defaultNode = new ServerNode();
            defaultNode.setName("Servidor Clúster");
            defaultNode.setIpAddress("127.0.0.1");
            defaultNode.setOperatingSystem(System.getProperty("os.name"));
            defaultNode.setActive(true);
            return nodeRepository.save(defaultNode);
        });

        OperatingSystemMXBean osBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        double cpuUsage = Math.round((osBean.getCpuLoad() * 100) * 100.0) / 100.0;
        if (cpuUsage < 0)
            cpuUsage = 0.0;

        double totalRam = (double) osBean.getTotalMemorySize() / (1024 * 1024 * 1024);
        double freeRam = (double) osBean.getFreeMemorySize() / (1024 * 1024 * 1024);
        double usedRam = Math.round((totalRam - freeRam) * 100.0) / 100.0;

        File root = new File("/");
        double diskUsagePercentage = Math.round(
                (((double) (root.getTotalSpace() - root.getFreeSpace()) / root.getTotalSpace()) * 100) * 100.0) / 100.0;

        if (lastSavedMetric != null
                && lastSavedMetric.getCpuUsage() == cpuUsage
                && lastSavedMetric.getRamUsedGB() == usedRam
                && lastSavedMetric.getDiskUsagePercentage() == diskUsagePercentage) {
            System.out.println("💤 [Métricas] Sin cambios en hardware. Saltando inserción.");
            return;
        }

        ResourceMetric metric = new ResourceMetric();
        metric.setTimestamp(LocalDateTime.now());
        metric.setCpuUsage(cpuUsage);
        metric.setRamUsedGB(usedRam);
        metric.setRamTotalGB(Math.round(totalRam * 100.0) / 100.0);
        metric.setDiskUsagePercentage(diskUsagePercentage);
        metric.setServerNode(mainNode);

        // Mapeamos los directorios reales dinámicos para calcular su tamaño
        long ingestBytes = getFolderSizeInBytes("/monitored/ingest");
        long replicaBytes = getFolderSizeInBytes(clusterStoragePath);

        metric.setIngestDiskBytes(ingestBytes);
        metric.setReplicaDiskBytes(replicaBytes);

        this.lastSavedMetric = metricRepository.save(metric);
        System.out.println("📊 [Métricas] Nueva captura guardada. Volumen actual: " + replicaBytes + " bytes.");
    }

    public long getFolderSizeInBytes(String directoryPath) {
        try {
            Path folder = Paths.get(directoryPath);
            if (!Files.exists(folder))
                return 0L;
            return Files.walk(folder)
                    .filter(p -> p.toFile().isFile())
                    .mapToLong(p -> p.toFile().length())
                    .sum();
        } catch (Exception e) {
            return 0L;
        }
    }

    /**
     * Devuelve la lista de nombres de archivos que se encuentran físicamente
     * en el almacenamiento local de ESTE contenedor específico.
     */
    public List<String> getLocalStoredFiles() {
        List<String> fileNames = new ArrayList<>();
        File folder = new File(clusterStoragePath);
        if (folder.exists() && folder.isDirectory()) {
            File[] files = folder.listFiles();
            if (files != null) {
                for (File f : files) {
                    if (f.isFile()) {
                        fileNames.add(f.getName());
                    }
                }
            }
        }
        return fileNames;
    }

    /**
     * LÓGICA DE INGEST: Consulta de forma reactiva y agregada los archivos
     * de todas las réplicas registradas a través de los WebClients.
     */
    public List<String> getRemoteReplicaFiles() {
        // Si este nodo tiene réplicas configuradas, es el Ingest. Les pregunta a ellas.
        if (!webClients.isEmpty()) {
            try {
                // Tomamos la primera réplica activa para el listado del espejo (o las agrupas)
                return webClients.get(0).get()
                        .uri("/api/metrics/local-files") // Endpoint que debes mapear en el controlador
                        .retrieve()
                        .bodyToMono(new org.springframework.core.ParameterizedTypeReference<List<String>>() {
                        })
                        .onErrorReturn(new ArrayList<>())
                        .block();
            } catch (Exception e) {
                System.err.println("❌ No se pudo conectar con las réplicas para listar archivos: " + e.getMessage());
                return new ArrayList<>();
            }
        }
        // Si no tiene webclients, es una réplica ordinaria leyendo su propio disco
        return getLocalStoredFiles();
    }

    /**
     * Método corregido para forzar la recolección actualizando correctamente
     * según el rol del contenedor actual.
     */
    public void forceMetricsCollectionForced(boolean isIngest) {
        ServerNode mainNode = nodeRepository.findAll().stream().findFirst().orElseGet(() -> {
            ServerNode defaultNode = new ServerNode();
            defaultNode.setName("Servidor Clúster");
            defaultNode.setIpAddress("127.0.0.1");
            defaultNode.setOperatingSystem(System.getProperty("os.name"));
            defaultNode.setActive(true);
            return nodeRepository.save(defaultNode);
        });

        OperatingSystemMXBean osBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        double cpuUsage = Math.round((osBean.getCpuLoad() * 100) * 100.0) / 100.0;

        if (cpuUsage < 0)
            cpuUsage = 0.0;

        double totalRam = (double) osBean.getTotalMemorySize() / (1024 * 1024 * 1024);
        double freeRam = (double) osBean.getFreeMemorySize() / (1024 * 1024 * 1024);
        double usedRam = Math.round((totalRam - freeRam) * 100.0) / 100.0;

        File root = new File("/");
        double diskUsagePercentage = Math.round(
                (((double) (root.getTotalSpace() - root.getFreeSpace()) / root.getTotalSpace()) * 100) * 100.0) / 100.0;

        if (lastSavedMetric != null
                && lastSavedMetric.getCpuUsage() == cpuUsage
                && lastSavedMetric.getRamUsedGB() == usedRam
                && lastSavedMetric.getDiskUsagePercentage() == diskUsagePercentage) {
            System.out.println("💤 [Métricas] Sin cambios en hardware. Saltando inserción.");
            return;
        }

        ResourceMetric metric = new ResourceMetric();
        metric.setTimestamp(LocalDateTime.now());
        metric.setCpuUsage(cpuUsage);
        metric.setRamUsedGB(usedRam);
        metric.setRamTotalGB(Math.round(totalRam * 100.0) / 100.0);
        metric.setDiskUsagePercentage(diskUsagePercentage);
        metric.setServerNode(mainNode);

        // Mapeamos los directorios reales dinámicos para calcular su tamaño
        long ingestBytes = getFolderSizeInBytes("/monitored/ingest");
        long replicaBytes = getFolderSizeInBytes(clusterStoragePath);
        metric.setIngestDiskBytes(ingestBytes);
        metric.setReplicaDiskBytes(replicaBytes);

        this.lastSavedMetric = metricRepository.save(metric);

        if (isIngest) {
            ingestBytes = getFolderSizeInBytes("/monitored/ingest");
            // El Ingest lee el último registro para no machacar el dato de la réplica
            replicaBytes = metricRepository.findTopByOrderByTimestampDesc()
                    .map(ResourceMetric::getReplicaDiskBytes).orElse(0L);
        } else {
            replicaBytes = getFolderSizeInBytes(clusterStoragePath);
            ingestBytes = metricRepository.findTopByOrderByTimestampDesc()
                    .map(ResourceMetric::getIngestDiskBytes).orElse(0L);
        }
        System.out.println("📊 [Métricas] Nueva captura guardada. Volumen actual: " + replicaBytes + " bytes.");
        // Almacenas la métrica con los dos datos balanceados
    }
}