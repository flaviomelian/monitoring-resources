package com.flavio.backend.repository;

import com.flavio.backend.model.ResourceMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ResourceMetricRepository extends JpaRepository<ResourceMetric, Long> {
    // Recuperar las métricas de un nodo específico ordenadas por tiempo (para las gráficas)
    List<ResourceMetric> findByServerNodeIdOrderByTimestampAsc(Long serverNodeId);
    // Recupera el último registro global insertado en la base de datos basándose en el tiempo
    Optional<ResourceMetric> findTopByOrderByTimestampDesc();
}