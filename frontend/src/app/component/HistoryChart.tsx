import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Metric } from "../types";
import { NodeRole } from "./Dashboard";

interface Props {
  metrics: Metric[];
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  activeRole: NodeRole; // Añadimos el prop para controlar la visibilidad
}

export default function HistoryChart({ metrics, showAll, setShowAll, activeRole }: Props) {
  
  // Transformamos los bytes a MB y calculamos porcentajes de RAM
  const chartData = metrics.map((m) => ({
    ...m,
    ramUsagePercentage: m.ramTotalGB > 0 ? Math.round((m.ramUsedGB / m.ramTotalGB) * 100) : 0,
    ingestMB: Number(((m.ingestDiskBytes || 0) / 1048576).toFixed(1)),
    replicaMB: Number(((m.replicaDiskBytes || 0) / 1048576).toFixed(1)),
  }));

  const activeChartData = showAll ? chartData : chartData.slice(-20);

  // Decidimos dinámicamente qué métricas e intervalos se muestran
  const showCpuAndRam = activeRole === "all" || activeRole === "master";
  const showIngest = activeRole === "all" || activeRole === "ingesta";
  const showReplica = activeRole === "all" || activeRole === "replica";

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold">
          {activeRole === "all" && "Histórico de Carga Reciente"}
          {activeRole === "master" && "Rendimiento: Nodo Principal"}
          {activeRole === "ingesta" && "Carga: Nodo de Ingesta"}
          {activeRole === "replica" && "Estado: Nodo de Réplica"}
        </h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
            showAll ? "bg-purple-500/10 border-purple-500 text-purple-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {showAll ? "📊 Histórico Completo" : "⏱️ Tiempo Real (Últimos 20)"}
        </button>
      </div>

      <div className="h-80 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeChartData}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorIngest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReplica" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => t.split("T")[1]?.substring(0, 5) || t} />
            
            {/* Si filtramos por bytes/MB, quitamos la unidad fija de '%' en el eje Y */}
            <YAxis stroke="#64748b" unit={activeRole === "master" || activeRole === "all" ? "%" : " MB"} />
            
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />

            {/* Renderizado condicional según el filtro activo */}
            {showCpuAndRam && (
              <>
                <Area type="monotone" dataKey="cpuUsage" name="CPU (%)" stroke="#10b981" fill="url(#colorCpu)" strokeWidth={2} />
                <Area type="monotone" dataKey="ramUsagePercentage" name="RAM (%)" stroke="#3b82f6" fill="url(#colorRam)" strokeWidth={2} />
              </>
            )}

            {showIngest && (
              <Area type="monotone" dataKey="ingestMB" name="Búfer Ingesta (MB)" stroke="#f59e0b" fill="url(#colorIngest)" strokeWidth={2} />
            )}

            {showReplica && (
              <Area type="monotone" dataKey="replicaMB" name="Almacenamiento Réplica (MB)" stroke="#a855f7" fill="url(#colorReplica)" strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}