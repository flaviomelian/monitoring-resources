package com.flavio.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "server_nodes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServerNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "operating_system", length = 100)
    private String operatingSystem;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    // Relación Code-First: Un nodo tiene muchas métricas históricas
    // Si borramos un nodo, se borran sus métricas en cascada (orphanRemoval)
    @JsonBackReference
    @OneToMany(mappedBy = "serverNode", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ResourceMetric> metrics;
}