"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import GlobalMetrics from "./GlobalMetrics";
import NodesGrid from "./NodesGrid";
import HistoryChart from "./HistoryChart";
import MetricsTable from "./MetricsTable";
import { Metric } from "../types";

// Definimos los roles lógicos de cada nodo
export type NodeRole = "all" | "master" | "ingesta" | "replica";

const emptyMetric: Metric = {
  id: 0,
  cpuUsage: 0,
  ramTotalGB: 16,
  ramUsedGB: 0,
  diskUsagePercentage: 0,
  ingestDiskBytes: 0,
  replicaDiskBytes: 0,
  timestamp: new Date().toISOString(),
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [showAll, setShowAll] = useState<boolean>(false);
  
  // Estado para el filtro visual de nodo activo
  const [activeRole, setActiveRole] = useState<NodeRole>("all"); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Apuntamos SIEMPRE al único endpoint que funciona
        const res = await fetch("http://localhost:8082/api/metrics/history/1");
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = (await res.json()) as Metric[];
        setMetrics(data);
      } catch (err) {
        console.error("Error devorando métricas del back:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : emptyMetric;

  return (
    <div className="p-4 md:p-8 bg-slate-950 text-slate-100 min-h-screen w-full flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8">
        <Header />

        {/* --- SELECTOR DE NODO LÓGICO --- */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-400">Filtro de Desglose</h3>
            <p className="text-xs text-slate-500">Aísla el histórico visual por rol de nodo en el clúster</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { role: "all", name: "⚡ Todo el Clúster" },
              { role: "master", name: "🖥️ Nodo Master (CPU/RAM)" },
              { role: "ingesta", name: "📥 Nodo Ingesta (Búfer)" },
              { role: "replica", name: "💾 Nodo Réplica (Almacenamiento)" },
            ].map((btn) => (
              <button
                key={btn.role}
                onClick={() => setActiveRole(btn.role as NodeRole)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  activeRole === btn.role
                    ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {btn.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            <GlobalMetrics latest={latest} />
            <NodesGrid latest={latest} />
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <HistoryChart
              metrics={metrics}
              showAll={showAll}
              setShowAll={setShowAll}
              activeRole={activeRole} // Le pasamos el rol activo para filtrar las líneas del gráfico
            />
            <MetricsTable metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
}