package com.flavio.backend.repository;

import com.flavio.backend.model.ResourceMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ResourceMetricRepository extends JpaRepository<ResourceMetric, Long> {
    // Recuperar las métricas de un nodo específico ordenadas por tiempo (para las
    // gráficas)
    List<ResourceMetric> findByServerNodeIdOrderByTimestampAsc(Long serverNodeId);

    // Recupera el último registro global insertado en la base de datos basándose en
    // el tiempo
    Optional<ResourceMetric> findTopByOrderByTimestampDesc();

    // Agrupar por la media de cada timestamp
    @Query(value = "SELECT " +
            "  timestamp as timestamp, " +
            "  ROUND(AVG(cpu_usage), 2) as cpuUsage, " +
            "  ROUND(AVG(ram_used_gb), 2) as ramUsedGb, " +
            "  ROUND(AVG(disk_usage_percentage), 2) as diskUsagePercentage, " +
            "  SUM(ingest_disk_bytes) as ingestDiskBytes, " + // La ingesta se suele SUMAR, no promediar
            "  SUM(replica_disk_bytes) as replicaDiskBytes " +
            "FROM resource_metrics " +
            "GROUP BY timestamp " +
            "ORDER BY timestamp DESC LIMIT 50", nativeQuery = true)
    List<Object[]> findClusterAverageMetrics();
}