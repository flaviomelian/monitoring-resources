"use client";
import { useState, useEffect } from "react";
import {
  RefreshCw,
  Layers,
  Cpu,
  Globe,
  Server,
  Zap,
  FolderCode
} from "lucide-react";
import Header from "../component/Header";
import { MeshAppsGrid } from "../component/MeshAppsGrid";
import { StackTopologyGrid } from "../component/StackTopolgyGrid"
import { DockerContainerStatus, AppStack, MeshApp, SiteInfo } from "../types";

const MESH_HOST = "despacho-desktop-3basi77.tail645042.ts.net";
const MESH_API = `http://${MESH_HOST}:8081`;

// Deduce el nodo de almacenamiento a partir del nombre del contenedor:
// alpine-replica-1 -> replica1, alpine-replica-2 -> replica2, resto -> ingest
const nodeFromName = (name: string): string => {
  const m = name.match(/replica-?(\d+)/i);
  return m ? `replica${m[1]}` : "ingest";
};

// Contenedores que no sirven HTTP/archivos (bases de datos)
const isDatabaseContainer = (name: string): boolean =>
  /mysql|db|postgres/i.test(name);

export default function UserHubDashboard() {
  const [activeTab] = useState<
    "dashboard" | "kanban" | "notes" | "files"
  >("dashboard");

  const [containers, setContainers] = useState<DockerContainerStatus[]>([]);
  // Proyectos web de cada nodo: { ingest: [...], replica1: [...], ... }
  const [sites, setSites] = useState<Record<string, SiteInfo[]>>({});
  const [systemOnline, setSystemOnline] = useState<boolean>(false);
  const [loadingContainers, setLoadingContainers] = useState<boolean>(false);

  const fetchClusterStatus = async () => {
    setLoadingContainers(true);
    try {
      const res = await fetch(
        `${MESH_API}/api/cluster/services`,
      );
      if (res.ok) {
        const data: DockerContainerStatus[] = await res.json();
        setContainers(data);
        setSystemOnline(true);

        // Proyectos web de cada nodo (ingest / replicaN), uno por carpeta con index.html
        const nodes = Array.from(
          new Set(
            data
              .filter(c => !c.app && !isDatabaseContainer(c.name))
              .map(c => nodeFromName(c.name)),
          ),
        );
        const entries = await Promise.all(
          nodes.map(async (n): Promise<[string, SiteInfo[]]> => {
            try {
              const r = await fetch(`${MESH_API}/api/sites/${n}`);
              return [n, r.ok ? await r.json() : []];
            } catch {
              return [n, []];
            }
          }),
        );
        setSites(Object.fromEntries(entries));
      } else {
        setSystemOnline(false);
      }
    } catch (error) {
      console.error("Error al conectar con la malla del clúster:", error);
      setSystemOnline(false);
    } finally {
      setLoadingContainers(false);
    }
  };

  useEffect(() => {
    const loadStatus = async () => await fetchClusterStatus();
    loadStatus();
    const interval = setInterval(fetchClusterStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Aplicaciones etiquetadas (mesh.app): se agrupan por app y se abren desde su frontend
  const getApps = (): MeshApp[] => {
    const map = new Map<string, DockerContainerStatus[]>();
    containers
      .filter(c => c.app)
      .forEach(c => map.set(c.app as string, [...(map.get(c.app as string) ?? []), c]));

    return [...map.entries()].map(([name, parts]) => ({
      name,
      parts,
      web: parts.find(p => p.role === "frontend" && p.port),
      healthy: parts.every(p => p.state === "running"),
    }));
  };

  // Los contenedores de infraestructura (sin etiqueta) siguen en la topología de stacks
  const getAppStacks = (): AppStack[] => {
    const infra = containers.filter(c => !c.app);
    const dbContainers = infra.filter(c => c.name.toLowerCase().includes("db") || c.name.toLowerCase().includes("mysql") || c.name.toLowerCase().includes("postgres"));
    const backendContainers = infra.filter(c => c.name.toLowerCase().includes("backend") || c.name.toLowerCase().includes("app") || c.name.toLowerCase().includes("ingest"));
    const replicaContainers = infra.filter(c => c.name.toLowerCase().includes("replica") || c.name.toLowerCase().includes("node"));

    const categorizedNames = new Set([...dbContainers, ...backendContainers, ...replicaContainers].map(c => c.name));
    const otherContainers = infra.filter(c => !categorizedNames.has(c.name));

    const stacks: AppStack[] = [
      {
        stackName: "Database Layer",
        description: "Persistencia y almacenamiento relacional del clúster",
        containers: dbContainers,
      },
      {
        stackName: "Core Backend & Ingest",
        description: "API Spring Boot, orquestadores y servicios de ingesta",
        containers: backendContainers,
      },
      {
        stackName: "Cluster Replicas / Nodes",
        description: "Instancias escaladas horizontalmente y nodos de trabajo",
        containers: replicaContainers,
      },
    ];

    if (otherContainers.length > 0)
      stacks.push({
        stackName: "Edge & Miscellaneous",
        description: "Servicios de red, proxies o herramientas auxiliares",
        containers: otherContainers,
      });

    return stacks.filter(s => s.containers.length > 0);
  };

  // Abre en una pestaña nueva el proyecto web de un nodo (su index.html).
  const handleOpenSite = (node: string, app: string) => {
    window.open(`${MESH_API}/api/sites/${node}/${app}/index.html`, "_blank", "noopener,noreferrer");
  };

  // Abre el frontend de una app del mesh en una nueva pestaña
  const handleOpenApp = (port: string) => {
    window.open(`http://${MESH_HOST}:${port}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-slate-950">
      <div className="px-4 md:px-8 pt-6">
        <Header />
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 ">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <Layers className="text-indigo-500" size={28} />
                  Malla de Aplicaciones y Stacks
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Topología y estado operativo de los microservicios distribuidos en el clúster.
                </p>
              </div>
              <button
                onClick={fetchClusterStatus}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition shadow-sm self-start"
              >
                <RefreshCw size={14} className={loadingContainers ? "animate-spin text-indigo-400" : ""} />
                <span>Sincronizar Malla</span>
              </button>
            </div>

            {/* Top Level Mesh Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estado del Clúster</span>
                  <div className="text-2xl font-bold text-white flex items-center gap-2 mt-1">
                    {systemOnline ? "Mesh Online" : "Desconectado"}
                    <span className={`h-2.5 w-2.5 rounded-full ${systemOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Globe size={20} />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contenedores Activos</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {containers.filter(c => c.state === "running").length} / {containers.length}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Cpu size={20} />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stacks Desplegados</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {getAppStacks().length} Stacks
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Server size={20} />
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: Aplicaciones Dinámicas del Mesh */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Zap size={12} /> Servicios Dinámicos
                </span>
                <span className="text-xs text-slate-400">Apps independientes con puertos expuestos y contenedores propios</span>
              </div>
              <MeshAppsGrid apps={getApps()} onOpenApp={handleOpenApp} />
            </div>

            {/* SECCIÓN 2: Sitios Estáticos y Stacks de Infraestructura */}
            <div className="space-y-3 pt-4 border-t border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FolderCode size={12} /> Sitios Estáticos & Stacks
                </span>
                <span className="text-xs text-slate-400">Herramientas servidas desde volúmenes compartidos y bases de infraestructura</span>
              </div>
              <StackTopologyGrid
                stacks={getAppStacks()}
                sites={sites}
                nodeFromName={nodeFromName}
                isDatabaseContainer={isDatabaseContainer}
                onOpenSite={handleOpenSite}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}