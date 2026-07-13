"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import GlobalMetrics from "./GlobalMetrics";
import NodesGrid from "./NodesGrid";
import HistoryChart from "./HistoryChart";
import MetricsTable from "./MetricsTable";
import { Metric } from "../types";

// 1. Definimos un estado inicial limpio por si la BD está vacía
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

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  // 2. Si no hay métricas, usamos el objeto vacío para no romper los componentes
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : emptyMetric;

  return (
    <div className="p-4 md:p-8 bg-slate-950 text-slate-100 min-h-screen w-full flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8">
        <Header />

        {/* 3. Quitamos el candado de {latest && ...}. Ahora siempre se renderiza */}
        <div className="flex flex-row gap-3">
          <div>
            <GlobalMetrics latest={latest} />
            <NodesGrid latest={latest} />
          </div>

          <div className="flex flex-col gap-3">
            <HistoryChart
              metrics={metrics}
              showAll={showAll}
              setShowAll={setShowAll}
            />
            <MetricsTable metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
}
