'use client'
import { useState, useEffect } from "react";
import Header from "../component/Header"; // Ajusta la ruta según tu estructura real
import { Monitor, Layers, Cpu, ShieldCheck, FolderTree, GitCommit, ArrowRight, Server, Database, Lock, Globe, Boxes, Network, CheckCircle2, Loader2 } from "lucide-react";

export default function FrontendDocsPage() {
  const [containerCount, setContainerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchActiveContainers() {
      try {
        // Ajusta la URL de tu endpoint si apunta a un puerto/ruta diferente (ej: /api/nodes o URL del backend)
        const response = await fetch("http://localhost:8081/api/nodes", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Nos quedamos únicamente con la longitud del array recibido
          if (Array.isArray(data)) {
            setContainerCount(data.length);
          } else {
            setContainerCount(0);
          }
        } else {
          setContainerCount(0);
        }
      } catch (error) {
        console.error("Error al consultar /nodes:", error);
        setContainerCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveContainers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 w-full">
      <div className="w-full space-y-6">
        <Header />

        <main className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 space-y-8 shadow-xl w-full">
          {/* Título y descripción */}
          <div className="space-y-2 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <Monitor className="text-cyan-400 h-8 w-8" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Documentación del Cliente (Frontend)</h2>
            </div>
            <p className="text-slate-400 text-sm md:text-base">
              Visión general de la arquitectura, módulos, flujo operativo, gestión de estado y control de accesos implementados en la interfaz de usuario de DockStream.
            </p>
          </div>

          {/* Secciones de documentación distribuidas en pantalla completa con efectos hover */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Arquitectura y Rutas */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-slate-900/50">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <FolderTree size={20} />
                  <h3>Estructura y Rutas</h3>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 font-mono">
                  <li className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 flex items-center gap-2 transition hover:border-slate-700">
                    <span className="text-indigo-300 font-bold">/dashboard</span> <span>Panel (Admin)</span>
                  </li>
                  <li className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 flex items-center gap-2 transition hover:border-slate-700">
                    <span className="text-amber-300 font-bold">/kanban</span> <span>Tareas</span>
                  </li>
                  <li className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 flex items-center gap-2 transition hover:border-slate-700">
                    <span className="text-violet-300 font-bold">/notes</span> <span>Apuntes</span>
                  </li>
                  <li className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 flex items-center gap-2 transition hover:border-slate-700">
                    <span className="text-emerald-300 font-bold">/files</span> <span>Ficheros</span>
                  </li>
                  <li className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 flex items-center gap-2 transition hover:border-slate-700">
                    <span className="text-blue-300 font-bold">/services</span> <span>Réplicas</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Flujo de Trabajo */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-slate-900/50">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <GitCommit size={20} />
                  <h3>Flujo de Trabajo</h3>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 font-mono">
                  <li className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 transition hover:border-slate-700">
                    <span className="text-rose-300 font-bold">1. Auth:</span> Login y almacenamiento JWT/Rol.
                  </li>
                  <li className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 transition hover:border-slate-700">
                    <span className="text-rose-300 font-bold">2. Routing:</span> Validación en <code className="text-cyan-300">Header</code>.
                  </li>
                  <li className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 transition hover:border-slate-700">
                    <span className="text-rose-300 font-bold">3. Fetch:</span> Peticiones REST al backend.
                  </li>
                </ol>
              </div>
            </div>

            {/* Seguridad y Roles */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-slate-900/50">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <ShieldCheck size={20} />
                  <h3>Seguridad y Accesos</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Persistencia mediante <code className="text-purple-300 font-mono bg-purple-950/40 px-1 py-0.5 rounded">localStorage</code> guardando token y rol (<code className="text-amber-300 font-mono">ROLE_ADMIN</code>). 
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Evaluación dinámica en el <code className="text-cyan-300 font-mono">Header</code> para ocultar rutas y prevenir accesos no autorizados.
                </p>
              </div>
            </div>

            {/* Tecnologías */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-slate-900/50">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Cpu size={20} />
                  <h3>Stack Tecnológico</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 transition hover:border-slate-700">Next.js App Router</span>
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 transition hover:border-slate-700">React & TS</span>
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 transition hover:border-slate-700">Tailwind CSS</span>
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 transition hover:border-slate-700">Lucide Icons</span>
                </div>
              </div>
            </div>

            {/* Comunicación */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-slate-900/50">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-semibold">
                  <Layers size={20} />
                  <h3>Servidor e integración</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conexión directa con endpoints de Spring Boot gestionando cabeceras CORS en entornos locales y mallas Tailscale.
                </p>
              </div>
            </div>

          </div>

          {/* Animación / Diagrama interactivo del flujo de trabajo en tiempo real */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <h3>Simulación Dinámica del Ciclo de Petición (Pipeline Client-Server)</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                Live Data Flow
              </span>
            </div>

            {/* Contenedor de nodos animados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3 transition hover:border-cyan-500/50 group">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:scale-110 transition">
                  <Globe size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">1. Cliente Next.js</p>
                  <p className="text-[11px] text-slate-400 font-mono">Render UI & State</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3 transition hover:border-amber-500/50 group">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:scale-110 transition animate-pulse">
                  <Lock size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">2. LocalStorage JWT</p>
                  <p className="text-[11px] text-slate-400 font-mono">Header Role Check</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3 transition hover:border-blue-500/50 group">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition">
                  <Server size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">3. Spring Boot API</p>
                  <p className="text-[11px] text-slate-400 font-mono">Tailscale / CORS</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3 transition hover:border-purple-500/50 group">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition">
                  <Database size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">4. MySQL Cluster</p>
                  <p className="text-[11px] text-slate-400 font-mono">Replicación Fan-Out</p>
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-2">
                <ArrowRight size={14} className="text-cyan-400 animate-pulse" />
                <span>Estado de la red: Conectado a <code className="text-purple-300">monitor-net</code> (Delay Controlado)</span>
              </span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                Active 200 OK
              </span>
            </div>
          </div>

          {/* Animación: Replicación de Contenedores y Exposición de Aplicación */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <h3>Orquestación y Replicación Dinámica de Contenedores</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                Scale-Out & Expose
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3 transition hover:border-indigo-500/50 group">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:scale-110 transition">
                  <Server size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">1. Imagen Base (Registry)</p>
                  <p className="text-[11px] text-slate-400 font-mono">Build Dockerfile</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3 transition hover:border-cyan-500/50 group">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:scale-110 transition animate-pulse">
                  <Boxes size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">2. Escalado de Réplicas</p>
                  <p className="text-[11px] text-slate-400 font-mono">Docker Compose / Scale</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3 transition hover:border-emerald-500/50 group">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:scale-110 transition">
                  <Network size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">3. Exposición de App</p>
                  <p className="text-[11px] text-slate-400 font-mono">Port Mapping & Tailscale</p>
                </div>
              </div>
            </div>

            {/* Barra de estado con recuento dinámico de /nodes */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>
                  Clúster Activo:{" "}
                  <code className="text-indigo-300">
                    {loading ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Consultando...
                      </span>
                    ) : (
                      `${containerCount ?? 0} Réplica(s) en ejecución`
                    )}
                  </code>{" "}
                  y enrutadas correctamente
                </span>
              </span>
              <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px]">
                Mesh VPN Ready
              </span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}