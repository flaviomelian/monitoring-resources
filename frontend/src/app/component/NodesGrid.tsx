import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  RefreshCw,
  HardDrive,
  ShieldAlert,
  Plus,
  Server,
} from "lucide-react";
import { Metric } from "../types";

interface Props {
  latest: Metric;
}

export default function NodesGrid({ latest }: Props) {
  const [uploading, setUploading] = useState(false);
  const [creatingNode, setCreatingNode] = useState(false); // Estado para controlar la creación de réplicas
  const [ingestFiles, setIngestFiles] = useState<string[]>([]);
  const [replica1Files, setReplica1Files] = useState<string[]>([]);
  const [replica2Files, setReplica2Files] = useState<string[]>([]);

  const fetchVolumeFiles = async (signal?: AbortSignal) => {
    try {
      // Disparamos las 3 peticiones en paralelo. Si una falla, no tira las demás.
      const [resIngest, resReplica1, resReplica2] = await Promise.all([
        fetch("http://localhost:8081/api/metrics/ingest/files", {
          signal,
        }).catch(() => null),
        fetch("http://localhost:8082/api/metrics/replica/files", {
          signal,
        }).catch(() => null),
        fetch("http://localhost:8083/api/metrics/replica/files", {
          signal,
        }).catch(() => null),
      ]);

      // Parseamos los JSON de forma segura
      const dataIngest = resIngest?.ok ? await resIngest.json() : [];
      const dataReplica1 = resReplica1?.ok ? await resReplica1.json() : [];
      const dataReplica2 = resReplica2?.ok ? await resReplica2.json() : [];

      // Actualizamos los estados de una sola tacada
      setIngestFiles(dataIngest);
      setReplica1Files(dataReplica1);
      setReplica2Files(dataReplica2);
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
      const res = await fetch(
        "http://localhost:8081/api/metrics/ingest/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      console.log(res);
      if (res.ok) fetchVolumeFiles();
      else alert("❌ Error en la transmisión del bloque.");
    } catch (err) {
      console.error(err);
      alert("❌ Fallo de red con el nodo de Ingesta.");
    } finally {
      setUploading(false);
    }
  };

  // Función para enviar la orden de levantar un nuevo contenedor
  const handleCreateNode = async () => {
    setCreatingNode(true);
    try {
      const res = await fetch("http://localhost:8081/api/cluster/scale-up", {
        method: "POST",
      });
      const data = await res.text();

      if (res.ok) {
        alert(`🚀 ¡Orquestación exitosa!\n${data}`);
        fetchVolumeFiles();
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
          {/* BOTÓN ORQUESTRADOR: Escalar Clúster */}
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

          {/* Botón Refrescar */}
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

      {/* Grid Principal de Infraestructura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NODO 2: RÉPLICA RESPALDO PRIMARIA (A) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="font-bold text-sm tracking-tight text-slate-200 font-mono flex items-center gap-2">
                <Server className="h-4 w-4 text-purple-500/60" />
                alpine-replica-1
              </span>
              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black tracking-wide">
                REPLICA_A
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
            {replica1Files.length === 0 ? (
              <p className="text-slate-600 text-xs italic pt-2">
                Esperando asignación de bloques.
              </p>
            ) : (
              replica1Files.map((f, idx) => (
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

        {/* NODO 3: RÉPLICA RESPALDO SECUNDARIA (B) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="font-bold text-sm tracking-tight text-slate-200 font-mono flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-500/60" />
                alpine-replica-2
              </span>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-black tracking-wide">
                REPLICA_B
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                Espacio Espejo
              </p>
              <p className="text-2xl font-black text-cyan-400 font-mono mt-0.5">
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
              hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/30
              [scrollbar-width:thin]
              [scrollbar-color:theme(colors.slate.800)_transparent]"
          >
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
              Volumen Espejo Respaldo
            </p>
            {replica2Files.length === 0 ? (
              <p className="text-slate-600 text-xs italic pt-2">
                Esperando asignación de bloques.
              </p>
            ) : (
              replica2Files.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-slate-400 font-mono py-0.5 border-b border-slate-900/40 last:border-0"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-cyan-500/40 flex-shrink-0" />
                  <span className="truncate" title={f}>
                    {f}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}