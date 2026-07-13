package com.flavio.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "resource_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "cpu_usage", nullable = false)
    private Double cpuUsage;

    @Column(name = "ram_used_gb", nullable = false)
    private Double ramUsedGB;

    @Column(name = "ram_total_gb", nullable = false)
    private Double ramTotalGB;

    @Column(name = "disk_usage_percentage", nullable = false)
    private Double diskUsagePercentage;

    // Relación Many-to-One: Muchas métricas pertenecen a un solo servidor
    @JsonManagedReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_node_id", nullable = false)
    private ServerNode serverNode;

    @Column(name = "ingest_disk_bytes", nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    private long ingestDiskBytes;

    @Column(name = "replica_disk_bytes", nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    private long replicaDiskBytes;
}