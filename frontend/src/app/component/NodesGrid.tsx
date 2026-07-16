import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  RefreshCw,
  HardDrive,
  Plus,
  Server,
} from "lucide-react";
import { Metric } from "../types";

interface Props {
  latest: Metric;
}

// Estructura para almacenar las réplicas detectadas dinámicamente
interface ReplicaNode {
  port: number;
  name: string;
  files: string[];
}

export default function NodesGrid({ latest }: Props) {
  const [uploading, setUploading] = useState(false);
  const [creatingNode, setCreatingNode] = useState(false);
  const [ingestFiles, setIngestFiles] = useState<string[]>([]);
  
  // Estado dinámico para todas las réplicas activas detectadas
  const [activeReplicas, setActiveReplicas] = useState<ReplicaNode[]>([]);

  // Rango de puertos donde esperas que se levanten tus réplicas
  // Por ejemplo, de la 8082 a la 8086 (soporta hasta 5 réplicas simultáneas de base)
  const REPLICA_PORTS = [8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090];

  const fetchVolumeFiles = async (signal?: AbortSignal) => {
    try {
      // 1. Obtener archivos del nodo de ingesta principal
      const resIngest = await fetch("http://localhost:8081/api/metrics/ingest/files", { signal }).catch(() => null);
      const dataIngest = resIngest?.ok ? await resIngest.json() : [];
      setIngestFiles(dataIngest);

      // 2. Escaneo y obtención en paralelo de las réplicas activas
      const replicaPromises = REPLICA_PORTS.map(async (port, index) => {
        try {
          const res = await fetch(`http://localhost:${port}/api/metrics/replica/files`, { signal });
          if (res.ok) {
            const files = await res.json();
            return {
              port,
              name: `alpine-replica-${index + 1}`,
              files,
            } as ReplicaNode;
          }
        } catch {
          // Si falla la conexión (el contenedor no existe aún), devolvemos null
          return null;
        }
        return null;
      });

      const results = await Promise.all(replicaPromises);
      
      // Filtramos las que han respondido correctamente (no nulas) y actualizamos el estado
      const detectedReplicas = results.filter((r): r is ReplicaNode => r !== null);
      setActiveReplicas(detectedReplicas);

    } catch (err) {
      console.error("Error devorando directorios del clúster:", err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const initFetch = async () => {
      await fetchVolumeFiles(controller.signal);
    };
    initFetch();

    const interval = setInterval(() => {
      fetchVolumeFiles(controller.signal);
    }, 5000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("http://localhost:8081/api/metrics/ingest/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) fetchVolumeFiles();
      else alert("❌ Error en la transmisión del bloque.");
    } catch (err) {
      console.error(err);
      alert("❌ Fallo de red con el nodo de Ingesta.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateNode = async () => {
    setCreatingNode(true);
    try {
      const res = await fetch("http://localhost:8081/api/cluster/scale-up", {
        method: "POST",
      });
      const data = await res.text();

      if (res.ok) {
        alert(`🚀 ¡Orquestación exitosa!\n${data}`);
        // Forzamos refresco inmediato para capturar el nuevo puerto levantado
        setTimeout(() => fetchVolumeFiles(), 1500); 
      } else {
        alert(`❌ Error al escalar el clúster: ${data}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error crítico en la llamada de red al orquestador.");
    } finally {
      setCreatingNode(false);
    }
  };

  return (
    <section className="space-y-4 mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-500">
          Desglose de Almacenamiento por Nodo del Clúster
        </h2>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNode}
            disabled={creatingNode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border 
              ${
                creatingNode
                  ? "bg-purple-950/20 border-purple-500/20 text-purple-400/50 cursor-not-allowed animate-pulse"
                  : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50"
              }`}
          >
            {creatingNode ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {creatingNode ? "Levantando Réplica..." : "Añadir Nodo Réplica"}
          </button>

          <button
            onClick={() => fetchVolumeFiles()}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                uploading ? "animate-spin text-amber-400" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* NODO 1: GATEWAY DE INGESTA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="font-bold text-sm tracking-tight text-slate-200 font-mono flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-500/60" />
              alpine-ingest-app
            </span>
            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black tracking-wide">
              GATEWAY
            </span>
          </div>

          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                Búfer de Entrada
              </p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {((latest.ingestDiskBytes || 0) / 1048576).toFixed(1)}{" "}
                <span className="text-xs font-normal text-slate-400">MB</span>
              </p>
            </div>

            <label
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-pointer hover:bg-amber-500/20 transition-all ${
                uploading ? "opacity-50 pointer-events-none animate-pulse" : ""
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Replicando..." : "Inyectar Bloque"}
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
            Historial de Tránsito
          </p>
          {ingestFiles.length === 0 ? (
            <p className="text-slate-600 text-xs italic pt-2">
              No hay bloques retenidos en tránsito.
            </p>
          ) : (
            ingestFiles.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-slate-400 font-mono py-0.5 border-b border-slate-900/40 last:border-0"
              >
                <FileText className="h-3.5 w-3.5 text-amber-500/40 shrink-0" />
                <span className="truncate" title={f}>
                  {f}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* GRID DINÁMICO DE RÉPLICAS */}
      {activeReplicas.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm italic">
            Buscando réplicas activas en la red del clúster...
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-6 ${
          activeReplicas.length === 1 
            ? "md:grid-cols-1 max-w-md mx-auto" 
            : activeReplicas.length === 2 
            ? "md:grid-cols-2 max-w-4xl" 
            : "md:grid-cols-2 lg:grid-cols-3"
        }`}>
          {activeReplicas.map((replica) => (
            <div
              key={replica.port}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300 hover:border-slate-700"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <span className="font-bold text-sm tracking-tight text-slate-200 font-mono flex items-center gap-2">
                    <Server className="h-4 w-4 text-purple-500/60" />
                    {replica.name}
                  </span>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black tracking-wide">
                    PORT: {replica.port}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    Espacio Consolidado
                  </p>
                  <p className="text-2xl font-black text-purple-400 font-mono mt-0.5">
                    {((latest.replicaDiskBytes || 0) / 1048576).toFixed(1)}{" "}
                    <span className="text-xs font-normal text-slate-400">MB</span>
                  </p>
                </div>
              </div>

              <div
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 h-40 overflow-y-auto space-y-1.5 custom-scrollbar
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-slate-950/20
                  [&::-webkit-scrollbar-thumb]:bg-slate-800
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/30
                  [scrollbar-width:thin]
                  [scrollbar-color:theme(colors.slate.800)_transparent]"
              >
                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                  Volumen Espejo Activo
                </p>
                {replica.files.length === 0 ? (
                  <p className="text-slate-600 text-xs italic pt-2">
                    Esperando asignación de bloques.
                  </p>
                ) : (
                  replica.files.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-400 font-mono py-0.5 border-b border-slate-900/40 last:border-0"
                    >
                      <HardDrive className="h-3.5 w-3.5 text-purple-500/40 shrink-0" />
                      <span className="truncate" title={f}>
                        {f}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}