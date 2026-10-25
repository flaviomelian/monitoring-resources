package com.flavio.backend.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ruta absoluta o relativa en el disco donde guardas las carpetas de los sitios (ej: /monitored/)
        String uploadPath = Paths.get("/monitored").toUri().toString();

        registry.addResourceHandler("/api/sites/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600); // Opcional: caché para producción
    }
}