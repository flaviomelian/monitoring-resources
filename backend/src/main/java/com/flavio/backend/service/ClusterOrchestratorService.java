package com.flavio.backend.service;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Volume;
// IMPORTS CORREGIDOS:
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;

import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Service
public class ClusterOrchestratorService {

    private final DockerClient dockerClient;
    private final String NETWORK_NAME = "monitor-net";
    private final String REPLICA_IMAGE = "monitoring-resources-alpine-replica-1"; // Reutilizamos tu imagen base
                                                                                  // compilada

    public ClusterOrchestratorService() {
        File dockerSocket = new File("/var/run/docker.sock");
        if (dockerSocket.exists()) {
            try {
                // 1. Limpieza y bypass de autodetección de docker-java
                System.setProperty("docker.host", "unix:///var/run/docker.sock");

                // 2. Construir la configuración asegurando que no se herede basura
                DefaultDockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                        .withDockerHost("unix:///var/run/docker.sock")
                        .build();

                // 3. Forzar explícitamente la URI del socket en el transporte HTTP5
                DockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                        .dockerHost(new java.net.URI("unix:///var/run/docker.sock")) // <-- Forzado como URI pura
                        .sslConfig(config.getSSLConfig())
                        .build();

                this.dockerClient = DockerClientImpl.getInstance(config, httpClient);
                System.out.println("--- [ORQUESTRADOR] Conectado con éxito al socket de Docker del Host ---");
            } catch (Exception e) {
                throw new RuntimeException("Error al levantar el cliente de Docker: " + e.getMessage(), e);
            }
        } else {
            this.dockerClient = null;
            System.out.println("--- [ORQUESTRADOR] Socket no detectado. Modo réplica pasivo activo. ---");
        }
    }

    /**
     * Levanta un nuevo nodo réplica en caliente en el clúster.
     */
    public String createNewReplicaNode() {
        if (this.dockerClient == null) {
            throw new IllegalStateException(
                    "Este contenedor no tiene acceso al socket de Docker (/var/run/docker.sock)");
        }

        // 1. Listar contenedores activos para calcular el siguiente índice
        List<Container> containers = dockerClient.listContainersCmd().withShowAll(true).exec();

        long nextId = containers.stream()
                .map(Container::getNames)
                .flatMap(java.util.Arrays::stream)
                .filter(name -> name.contains("alpine-replica-"))
                .map(name -> name.replace("/alpine-replica-", ""))
                .mapToLong(name -> {
                    try {
                        return Long.parseLong(name);
                    } catch (Exception e) {
                        return 0;
                    }
                })
                .max()
                .orElse(2) + 1; // Si no hay más de 2, empezamos en el 3

        String nodeName = "alpine-replica-" + nextId;
        String storagePathHost = "./data/replica" + nextId;
        String storagePathContainer = "/monitored/replica" + nextId;

        // Crear físicamente el directorio en el host para evitar problemas de permisos
        new File(storagePathHost).mkdirs();

        try {
            // 2. Configurar HostConfig (Puertos, Redes y Volúmenes)
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withNetworkMode(NETWORK_NAME)
                    .withBinds(new Bind(new File(storagePathHost).getAbsolutePath(), new Volume(storagePathContainer)));

            // 3. Crear el contenedor
            String containerId = dockerClient.createContainerCmd(REPLICA_IMAGE)
                    .withName(nodeName)
                    .withHostConfig(hostConfig)
                    .withEnv(
                            "SPRING_DATASOURCE_URL=jdbc:mysql://custom-linux-db:3306/sandbox_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true",
                            "SPRING_DATASOURCE_USERNAME=root",
                            "SPRING_DATASOURCE_PASSWORD=root_password",
                            "STORAGE_PATH=" + storagePathContainer,
                            "SERVER_PORT=8080")
                    .exec()
                    .getId();

            // 4. Arrancar el contenedor
            dockerClient.startContainerCmd(containerId).exec();

            return "Nodo " + nodeName + " levantado con éxito. ID de contenedor: " + containerId;
        } catch (Exception e) {
            throw new RuntimeException("Error al orquestar el nuevo contenedor en Docker: " + e.getMessage(), e);
        }
    }
}