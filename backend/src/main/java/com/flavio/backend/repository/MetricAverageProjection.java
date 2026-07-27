package com.flavio.backend.repository;

import java.time.LocalDateTime;

public interface MetricAverageProjection {
    LocalDateTime getTimestamp();
    Double getCpuUsage();
    Double getRamUsedGb();
    Double getDiskUsagePercentage();
    Long getIngestDiskBytes();
    Long getReplicaDiskBytes();
}