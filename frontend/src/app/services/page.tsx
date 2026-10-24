"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  FolderUp,
  Search,
  Bell,
  Plus,
  Trash2,
  Clock,
  Menu,
  X,
  Download,
  Server,
  Activity,
  RefreshCw,
  Layers,
  Cpu,
  Globe,
  Terminal,
  ExternalLink,
  FileCode,
} from "lucide-react";
import Header from "../component/Header";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  tag: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  content?: string;
}

interface DockerContainerStatus {
  name: string;
  status: string;
  state: "running" | "restarting" | "stopped" | "error";
  port?: string;
  htmlFiles?: string[]; // Archivos HTML detectados en el almacenamiento del servicio
  app?: string | null; // etiqueta mesh.app del contenedor
  role?: "frontend" | "api" | "db" | string | null; // etiqueta mesh.role
}

interface AppStack {
  stackName: string;
  description: string;
  containers: DockerContainerStatus[];
}

// Aplicación desplegada en el mesh: agrupa los contenedores con el mismo mesh.app
interface MeshApp {
  name: string;
  parts: DockerContainerStatus[];
  web?: DockerContainerStatus; // contenedor frontend con puerto publicado
  healthy: boolean;
}

// Proyecto web (build de React/Next, HTML/CSS/JS) alojado en la carpeta de un nodo
interface SiteInfo {
  name: string;
  url: string;
}

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
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "kanban" | "notes" | "files"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [containers, setContainers] = useState<DockerContainerStatus[]>([]);
  // Proyectos web de cada nodo: { ingest: [...], replica1: [...], ... }
  const [sites, setSites] = useState<Record<string, SiteInfo[]>>({});
  const [systemOnline, setSystemOnline] = useState<boolean>(false);
  const [loadingContainers, setLoadingContainers] = useState<boolean>(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const fetchClusterStatus = async () => {
    setLoadingContainers(true);
    try {
      const res = await fetch(
        "http://despacho-desktop-3basi77.tail645042.ts.net:8081/api/cluster/services",
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

    if (otherContainers.length > 0) {
      stacks.push({
        stackName: "Edge & Miscellaneous",
        description: "Servicios de red, proxies o herramientas auxiliares",
        containers: otherContainers,
      });
    }

    return stacks.filter(s => s.containers.length > 0);
  };

  // Abre en una pestaña nueva el proyecto web de un nodo (su index.html).
  // Siempre consulta al backend del 8081, que lee la carpeta del nodo indicado.
  const handleOpenSite = (node: string, app: string) => {
    window.open(`${MESH_API}/api/sites/${node}/${app}/`, "_blank", "noopener,noreferrer");
  };

  // Abre el frontend de una app del mesh en una nueva pestaña
  const handleOpenApp = (port: string) => {
    window.open(`http://${MESH_HOST}:${port}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="px-4 md:px-8 pt-6">
        <Header />
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8">
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

            {/* Aplicaciones del mesh (contenedores con etiqueta mesh.app) */}
            {getApps().length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Aplicaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getApps().map((app) => (
                    <div key={app.name} className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:border-slate-700 transition">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-semibold text-white text-base truncate">{app.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${app.healthy ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                          {app.healthy ? "Operativa" : "Degradada"}
                        </span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        {app.parts.map((part) => (
                          <div key={part.name} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${part.state === "running" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                              <span className="text-slate-200 truncate">{part.name}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 shrink-0">
                              {part.role ?? "servicio"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {app.web ? (
                        <button
                          onClick={() => handleOpenApp(app.web!.port as string)}
                          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                        >
                          <ExternalLink size={14} />
                          <span>Abrir app</span>
                        </button>
                      ) : (
                        <span className="text-center text-[11px] text-slate-500">
                          Sin frontend publicado (mesh.role=frontend con puerto)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stacks Topology View */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Topología de Stacks</h3>
              
              {containers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  No se detectaron servicios en la malla. Comprueba que el backend y Tailscale estén operativos.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getAppStacks().map((stack, sIdx) => (
                    <div key={sIdx} className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-slate-700 transition">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white text-base">{stack.stackName}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {stack.containers.length} serv.
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{stack.description}</p>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        {stack.containers.map((container, cIdx) => (
                          <div key={cIdx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${container.state === "running" ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-amber-500"}`}></span>
                              <span className="text-xs font-medium text-slate-200 truncate">{container.name}</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {container.port && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                  :{container.port}
                                </span>
                              )}
                              {/* Un botón por proyecto web del nodo: abre su propio index.html (no aplica a bases de datos) */}
                              {!isDatabaseContainer(container.name) &&
                                (sites[nodeFromName(container.name)] ?? []).map((site) => (
                                  <button
                                    key={site.name}
                                    onClick={() => handleOpenSite(nodeFromName(container.name), site.name)}
                                    title={`Abrir ${site.name} en nueva pestaña`}
                                    className="px-2 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 transition flex items-center gap-1 text-[10px]"
                                  >
                                    <FileCode size={12} />
                                    <span className="max-w-[90px] truncate">{site.name}</span>
                                    <ExternalLink size={10} />
                                  </button>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}