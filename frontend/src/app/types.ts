export interface Metric {
  id: number;
  timestamp: string;
  cpuUsage: number;
  ramUsedGB: number;
  ramTotalGB: number;
  diskUsagePercentage: number;
  ingestDiskBytes: number;
  replicaDiskBytes: number;
}

export interface DockerContainerStatus {
  name: string;
  status: string;
  state: "running" | "restarting" | "stopped" | "error";
  port?: string;
  htmlFiles?: string[]; // Archivos HTML detectados en el almacenamiento del servicio
  app?: string | null;  // Etiqueta mesh.app del contenedor
  role?: "frontend" | "api" | "db" | string | null; // Etiqueta mesh.role
  cpuUsage?: string;
  memoryUsage?: string;
}

export interface AppStack {
  stackName: string;
  description: string;
  containers: DockerContainerStatus[];
}

// Aplicación desplegada en el mesh: agrupa los contenedores con el mismo mesh.app
export interface MeshApp {
  name: string;
  parts: DockerContainerStatus[];
  web?: DockerContainerStatus; // Contenedor frontend con puerto publicado
  healthy: boolean;
}

// Proyecto web (build de React/Next, HTML/CSS/JS) alojado en la carpeta de un nodo
export interface SiteInfo {
  name: string;
  url: string;
}

export interface SiteInfo {
  name: string;
  path: string; // ej: "replica1/net-probe"
}