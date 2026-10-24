package com.flavio.backend;

import com.flavio.backend.model.ServerNode;
import com.flavio.backend.repository.ServerNodeRepository;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.InetAddress;
import java.net.UnknownHostException;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

    public static void main(String[] args) {
        // Cargamos Dotenv al arrancar para que inyecte las variables del .env como System properties
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                // Solo las cargamos si no están ya definidas previamente por el sistema o Docker
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        } catch (Exception e) {
            System.out.println("⚠️ [Dotenv] No se pudo cargar el archivo .env (se usarán variables del sistema/Docker)");
        }

        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CommandLineRunner registerNodeRunner(ServerNodeRepository serverNodeRepository) {
        return args -> {
            // 1. Obtener el NODE_NAME del entorno (pasado por docker-compose)
            String nodeName = System.getenv("NODE_NAME");
            if (nodeName == null || nodeName.trim().isEmpty()) {
                try {
                    nodeName = InetAddress.getLocalHost().getHostName();
                } catch (UnknownHostException e) {
                    nodeName = "nodo-desconocido";
                }
            }

            // 2. Obtener la IP interna en la red virtual de Docker
            String ipAddress;
            try {
                ipAddress = InetAddress.getLocalHost().getHostAddress();
            } catch (UnknownHostException e) {
                ipAddress = "127.0.0.1";
            }

            // 3. Buscar si ya existe para actualizarlo o crear uno nuevo
            String finalNodeName = nodeName;
            ServerNode node = serverNodeRepository.findByName(finalNodeName)
                    .orElseGet(() -> {
                        ServerNode newNode = new ServerNode();
                        newNode.setName(finalNodeName);
                        return newNode;
                    });

            node.setIpAddress(ipAddress);
            node.setActive(true);
            node.setOperatingSystem(System.getProperty("os.name"));

            // 4. Persistir la entidad en MySQL
            serverNodeRepository.save(node);

            System.out.println("===========================================================================");
            System.out.println(">>> NODO REGISTRADO EN BD: " + nodeName + " (" + ipAddress + ") <<<");
            System.out.println("===========================================================================");
        };
    }
}