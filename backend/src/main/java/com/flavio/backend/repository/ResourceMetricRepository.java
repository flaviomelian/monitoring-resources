package com.flavio.backend.repository;

import com.flavio.backend.model.ResourceMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ResourceMetricRepository extends JpaRepository<ResourceMetric, Long> {

    List<ResourceMetric> findByServerNodeIdOrderByTimestampAsc(Long serverNodeId);

    Optional<ResourceMetric> findTopByOrderByTimestampDesc();

    @Query(value = "SELECT " +
            "  MIN(timestamp) AS timestamp, " +
            "  ROUND(AVG(cpu_usage), 2) AS cpuUsage, " +
            "  ROUND(AVG(ram_used_gb), 2) AS ramUsedGb, " +
            "  ROUND(AVG(disk_usage_percentage), 2) AS diskUsagePercentage, " +
            "  SUM(ingest_disk_bytes) AS ingestDiskBytes, " +
            "  SUM(replica_disk_bytes) AS replicaDiskBytes " +
            "FROM resource_metrics " +
            "GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') " +
            "ORDER BY timestamp ASC LIMIT 50", nativeQuery = true)
    List<MetricAverageProjection> findClusterAverageMetrics();
}