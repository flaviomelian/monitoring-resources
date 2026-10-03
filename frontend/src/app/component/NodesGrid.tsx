import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  RefreshCw,
  HardDrive,
  Plus,
  Server,
  Loader2,
  ExternalLink,
  ChevronDown,
  Check,
} from "lucide-react";
import { Metric } from "../types";
import { NodeTerminalModal } from "./NodeTerminalModal";

interface Props {
  latest: Metric;
}

interface ReplicaNode {
  port: number;
  name: string;
  files: string[];
  loading: boolean;
}

export default function NodesGrid({ latest }: Props) {
  const [uploading, setUploading] = useState(false);
  const [creatingNode, setCreatingNode] = useState(false);
  const [ingestFiles, setIngestFiles] = useState<string[]>([]);
  const [activeReplicas, setActiveReplicas] = useState<ReplicaNode[]>([]);

  // Estados para el selector de Fan-Out y selección múltiple
  const [selectedTargets, setSelectedTargets] = useState<string[]>(['FAN_OUT']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTarget = (target: string) => {
    if (target === 'FAN_OUT') {
      setSelectedTargets(['FAN_OUT']);
      return;
    }

    let updated = selectedTargets.filter(t => t !== 'FAN_OUT');
    
    if (updated.includes(target)) {
      updated = updated.filter(t => t !== target);
      if (updated.length === 0) updated = ['FAN_OUT'];
    } else {
      updated.push(target);
    }
    setSelectedTargets(updated);
  };

  const getDisplayText = () => {
    if (selectedTargets.includes('FAN_OUT')) return '⚡ Fan-Out (Broadcast a todos)';
    if (selectedTargets.length === 1) return selectedTargets[0];
    return `${selectedTargets.length} contenedores seleccionados`;
  };

  const fetchVolumeFiles = async (signal?: AbortSignal) => {
    try {
      const resIngest = await fetch(
        "http://despacho-desktop-3basi77.tail645042.ts.net:8081/api/metrics/ingest/files",
        { signal },
      ).catch(() => null);

      const dataIngest = resIngest?.ok ? await resIngest.json() : [];
      setIngestFiles(dataIngest);

      const resNodes = await fetch("http://despacho-desktop-3basi77.tail645042.ts.net:8081/api/cluster/nodes", {
        signal,
      }).catch(() => null);

      const nodeUrls: string[] = resNodes?.ok ? await resNodes.json() : [];

      const replicaPromises = nodeUrls.map(async (baseUrl, index) => {
        const port = parseInt(baseUrl.split(":").pop() || "8082", 10);
        const name = `alpine-replica-${index + 1}`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          if (signal) {
            signal.addEventListener("abort", () => controller.abort());
          }

          const res = await fetch(`${baseUrl}/api/metrics/replica/files`, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            const files = await res.json();
            return {
              port,
              name,
              files,
              loading: false,
            } as ReplicaNode;
          }
        } catch (err) {
          return {
            port,
            name,
            files: [],
            loading: true,
          } as ReplicaNode;
        }
        return null;
      });

      const results = await Promise.all(replicaPromises);
      const detectedReplicas = results.filter((r): r is ReplicaNode => r !== null);
      setActiveReplicas(detectedReplicas);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.warn("Aviso al consultar el clúster:", err.message);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadClusterData = async () => {
      await fetchVolumeFiles(controller.signal);
    };

    loadClusterData();
    const interval = setInterval(() => {
      loadClusterData();
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
    // Añadimos los targets seleccionados al FormData para que tu Spring Boot sepa a dónde enrutar el fan-out o los nodos específicos
    formData.append("targets", JSON.stringify(selectedTargets));

    setUploading(true);
    try {
      const res = await fetch(
        "http://despacho-desktop-3basi77.tail645042.ts.net:8081/api/metrics/ingest/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      if (res.ok) {
        fetchVolumeFiles();
        alert("✅ Archivo transmitido y replicado correctamente.");
      } else alert("❌ Error en la transmisión del bloque.");
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
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.text();

      if (res.ok) {
        alert(`🚀 ¡Orquestación exitosa!\n${data}`);
        setTimeout(() => fetchVolumeFiles(), 2000);
      } else {
        alert(`❌ Error (${res.status}) al escalar el clúster:\n${data}`);
      }
    } catch (err) {
      console.error("Error de red/CORS:", err);
      alert("❌ Fallo de red con el orquestador. Revisa los logs de consola.");
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
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black tracking-wide">
                GATEWAY
              </span>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black tracking-wide">
                PORT: 8081
              </span>
            </div>
          </div>

          {/* SELECTOR DE DESTINOS (FAN-OUT / MULTI-CONTAINER) */}
          <div className="mb-4 relative" ref={dropdownRef}>
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
              Destino de Replicación (Fan-Out / Selectivo)
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 hover:border-amber-500/40 transition-colors"
            >
              <span className="truncate">{getDisplayText()}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-amber-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
                <div
                  onClick={() => toggleTarget('FAN_OUT')}
                  className="flex items-center justify-between px-3 py-2 text-xs font-mono hover:bg-slate-900 cursor-pointer text-amber-400 border-b border-slate-900"
                >
                  <span>⚡ Fan-Out (Broadcast a todos)</span>
                  {selectedTargets.includes('FAN_OUT') && <Check className="h-3.5 w-3.5 text-amber-400" />}
                </div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  {activeReplicas.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-600 italic">No hay réplicas activas disponibles</div>
                  ) : (
                    activeReplicas.map((replica) => {
                      const isSelected = selectedTargets.includes(replica.name);
                      return (
                        <div
                          key={replica.port}
                          onClick={() => toggleTarget(replica.name)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-mono hover:bg-slate-900 cursor-pointer text-slate-300 transition-colors border-b border-slate-900/40 last:border-0"
                        >
                          <span className="truncate">{replica.name} <span className="text-slate-500 text-[10px]">(:{replica.port})</span></span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
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
            <div>
              <NodeTerminalModal nodeName="alpine-ingest-app-gateway" port={8081} color={'orange'}/>
            </div>
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
              <a
                key={idx}
                href={`http://localhost:8081/api/metrics/file/${f}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-xs text-slate-400 font-mono py-1 px-2 rounded hover:bg-slate-900 hover:text-amber-300 transition-colors border-b border-slate-900/40 last:border-0 group"
                title={`Abrir ${f} en nueva pestaña`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-3.5 w-3.5 text-amber-500/40 shrink-0" />
                  <span className="truncate">{f}</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400 shrink-0" />
              </a>
            ))
          )}
        </div>
      </div>

      {/* GRID DINÁMICO DE RÉPLICAS */}
      {activeReplicas.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm italic">
            No se detectan réplicas registradas o activas...
          </p>
        </div>
      ) : (
        <div
          className="max-h-190 overflow-y-auto pr-2 py-10
              [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_5%,black_95%,transparent_100%)]
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-slate-950/20
              [&::-webkit-scrollbar-thumb]:bg-slate-800
              [&::-webkit-scrollbar-thumb]:rounded-full
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
              scrollbar-thin
              [scrollbar-color:var(--color-slate-800)_transparent]"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="flex items-center gap-2">
                      {replica.loading && (
                        <Loader2 className="h-3.5 w-3.5 text-purple-400 animate-spin" />
                      )}
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black tracking-wide">
                        PORT: {replica.port}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        Espacio Consolidado
                      </p>
                      <p className="text-2xl font-black text-purple-400 font-mono mt-0.5">
                        {(latest.replicaDiskBytes / 1000000).toFixed(1)}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          MB
                        </span>
                      </p>
                    </div>
                    <div>
                      <NodeTerminalModal
                        nodeName={replica.name}
                        port={replica.port}
                        color={'purple'}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 h-40 overflow-y-auto space-y-1.5 [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-slate-950/20
                  [&::-webkit-scrollbar-thumb]:bg-slate-800
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
                  [scrollbar-width:thin]
                  [scrollbar-color:theme(colors.slate.800)_transparent]"
                >
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    Volumen Espejo Activo
                  </p>
                  {replica.files.length === 0 ? (
                    <p className="text-slate-600 text-xs italic pt-2">
                      {replica.loading
                        ? "Iniciando contenedor..."
                        : "Esperando asignación de bloques."}
                    </p>
                  ) : (
                    replica.files.map((f, idx) => (
                      <a
                        key={idx}
                        href={`http://despacho-desktop-3basi77.tail645042.ts.net:${replica.port}/api/metrics/file/${f}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-xs text-slate-400 font-mono py-1 px-2 rounded hover:bg-slate-900 hover:text-purple-300 transition-colors border-b border-slate-900/40 last:border-0 group"
                        title={`Abrir ${f} en ${replica.name} (Puerto ${replica.port})`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <HardDrive className="h-3.5 w-3.5 text-purple-500/40 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 shrink-0" />
                      </a>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}