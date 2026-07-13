# Cluster Infrastructure Monitor

Un sistema de monitorización y clúster distribuido de almacenamiento a bajo nivel construido con **Spring Boot (Java)**, **Docker / Docker Compose**, y un frontend reactivo en **Next.js**. 

El proyecto simula una infraestructura de red interna balanceada con topología de replicación en abanico (Fan-Out), latencia de red controlada y un pipeline de observabilidad en tiempo real.

---

## Arquitectura del Sistema

El clúster está diseñado bajo un modelo de aislamiento de contextos mediante contenedores independientes que se comunican a través de una red virtual interna (`monitor-net`).

### Componentes Clave:
* **Gateway de Ingesta (`alpine-ingest-app`)**: Actúa como el punto de entrada del clúster (NameNode). Intercepta los archivos entrantes, introduce de forma deliberada una latencia de red de 2 segundos para simular entornos distribuidos reales y distribuye de forma concurrente el flujo en abanico.
* **Nodos de Réplica (`alpine-replica-X`)**: Actúan como nodos dedicados de almacenamiento masivo (DataNodes). Persisten físicamente los bloques en volúmenes independientes y recopilan métricas de hardware locales.
* **Pipeline de Observabilidad**: Un recolector asíncrono interroga las métricas del host (`OperatingSystemMXBean`) y calcula el tamaño exacto en bytes de los descriptores de archivos para alimentar las gráficas temporales del Frontend.

---

## Desafíos Técnicos Resueltos

### 1. Control de Concurrencia y Evasión de Deadlocks en la JVM
Durante el desarrollo del pipeline reactivo con `WebClient`, el bloqueo del hilo de ejecución principal de Tomcat (`Tomcat-exec`) en combinación con flujos asíncronos concurrentes provocó un escenario de **Deadlock de infraestructura** (bloqueo mutuo de hilos de red esperando el volcado de buffers). 

* **Solución**: Se rediseñó la lógica abstrayendo la concurrencia mediante `CompletableFuture` nativos sobre un pool aislado (`ForkJoinPool`), aislando los buffers de memoria con `ByteArrayResource` antes de iniciar el Fan-Out para romper de raíz el acoplamiento de hilos.

### 2. Aislamiento de Contextos de Almacenamiento en Docker
Al compartir la lógica de negocio en una arquitectura monolítica-distribuida, los contenedores intentaban leer rutas físicas absolutas inexistentes debido al aislamiento de volumen.
* **Solución**: Se implementó una resolución dinámica de almacenamiento basada en variables de entorno de Docker (`cluster.storage.path`), delegando el inventario de archivos a un endpoint puente interno por HTTP cuando el Gateway de Ingesta solicita el estado de las réplicas.

---

## Tecnologías Utilizadas

* **Backend**: Java 21, Spring Boot 4.x, Spring Data JPA, WebFlux (WebClient).
* **Base de Datos**: MySQL 8.0.
* **Frontend**: Next.js, React, Tailwind CSS, Recharts.
* **Infraestructura**: Docker, Docker Compose, Linux (Alpine OS).

---

## Instalación y Despliegue

### Requisitos Previos
* Docker y Docker Compose instalados.
* Maven o el wrapper de Spring en local (`./mvnw`).

### Pasos para levantar el Clúster

1. **Clonar el repositorio y situarse en la raíz:**
   ```bash
   cd monitoring-resources