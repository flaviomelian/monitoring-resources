# DockStream — Cluster Infrastructure Monitor

Sistema avanzado de monitorización de recursos y orquestación de contenedores distribuida, construido bajo una arquitectura de microservicios contenerizados y un panel de operaciones en tiempo real.

---

## Arquitectura del Sistema

El clúster opera sobre una red virtual aislada (`monitor-net`) orquestada mediante **Docker Compose**, separando responsabilidades entre persistencia, lógica de negocio y capa de presentación.

### Componentes Clave de la Malla:
- **`crud-db` (MySQL 8.0)**: Nodo de base de datos relacional persistente con healthchecks estrictos para asegurar la sincronización inicial del clúster.
- **`crud-api` (Node.js / Backend)**: API REST centralizada que gestiona la persistencia de elementos, el enrutamiento de peticiones y la lógica transaccional.
- **`crud-web` (React + Vite + Tailwind CSS)**: Interfaz gráfica de operaciones en entorno oscuro, optimizada para la monitorización de recursos, gestión de tareas (Kanban) y telemetría de nodos.

---

## Desafíos Técnicos y Soluciones

1. **Gestión de Volúmenes y Sincronización en Entornos Docker**
   - *Problema*: Pérdida de dependencias locales (`node_modules`) al montar volúmenes de desarrollo interactivos sobre los contenedores de Node.
   - *Solución*: Configuración de comandos de arranque dinámicos combinados con la gestión limpia de volúmenes persistentes para garantizar la integridad del entorno sin intervención manual.

2. **Compilación de Estilos y Motor de Utilidades**
   - *Problema*: Incompatibilidades de directivas de diseño en contenedores ligeros Alpine.
   - *Solución*: Estandarización de componentes modulares y adaptación de clases de diseño hiper-optimizadas para garantizar una respuesta visual fluida y sin bloqueos de compilación.

---

## Tecnologías Utilizadas

- **Backend & Base de Datos**: Node.js, API REST, MySQL 8.0.
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons.
- **Infraestructura & Contenedorización**: Docker, Docker Compose, Linux Alpine, Redes de Malla Virtuales.

---

## Guía de Despliegue Rápido

### Requisitos Previos
- Docker y Docker Compose instalados en el sistema.

### Pasos para Levantar el Clúster

1. **Clonar el repositorio y situarse en la raíz del proyecto:**
   ```bash
   cd monitoring-resources
   ```

2. **Desplegar la infraestructura con Docker Compose (forzando reconstrucción limpia):**
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

3. **Acceder al panel web de operaciones:**
   - La interfaz estará disponible en: `http://localhost:3000`

---

## Telemetría y Estado de la Malla

El entorno incorpora un sistema de supervisión integrado en el panel de control:
- **Mesh Cluster**: `Operational` (Sincronizado en tiempo real).
- **Telemetry**: Activo mediante sondeo asíncrono.
- **Seguridad**: Canales protegidos bajo especificaciones TLS y pasarela de proxy interna de red.

---

## Autor

**Flavio Melián Santana**  
*Arquitectura de Software y Sistemas Distribuidos*
