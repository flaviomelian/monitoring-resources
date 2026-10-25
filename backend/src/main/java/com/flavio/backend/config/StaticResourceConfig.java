package com.flavio.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${cluster.storage.path:/monitored}")
    private String storageRoot;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Mapea la URL /sites/** directamente a la ruta física del volumen /monitored/
        registry.addResourceHandler("/sites/**")
                .addResourceLocations("file:" + storageRoot + "/");
    }
}
