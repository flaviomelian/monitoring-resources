"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Metric } from "../types";

interface Props {
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  height?: string;
}

export default function GlobalHistoryChart({
  showAll,
  setShowAll,
  height = "h-[400px]",
}: Props) {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    const fetchAverageMetrics = async () => {
      try {
        const avgMetricsRes = await fetch(
          "http://localhost:8081/api/metrics/history/average"
        );
        if (avgMetricsRes.ok) {
          const avgData = (await avgMetricsRes.json()) as Metric[];
          if (Array.isArray(avgData)) {
            setMetrics(avgData);
          }
        }
      } catch (err) {
        console.error("Error cargando la media del clúster:", err);
      }
    };

    fetchAverageMetrics();
    const interval = setInterval(fetchAverageMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mapeo seguro casteando a any para leer la propiedad tal cual viene de Spring Boot (ramUsedGb)
  const chartData = (metrics || []).map((rawMetric: unknown) => {
    const m = rawMetric as Metric & { ramUsedGb?: number; ramTotalGb?: number };
    
    const usedGB = m.ramUsedGb ?? m.ramUsedGB ?? 0;
    const totalGB = m.ramTotalGb && m.ramTotalGb > 0 ? m.ramTotalGb : 16;
    
    // Cálculo correcto del porcentaje (multiplicando por 100, que se te había escapado)
    const computedRamPercentage =
      totalGB > 0 ? Math.round((usedGB / totalGB) * 100) : 0;

    return {
      ...m,
      ramUsedGB: usedGB,
      ramTotalGB: totalGB,
      ramUsagePercentage: computedRamPercentage,
      ingestMB: Number(((m.ingestDiskBytes || 0) / 1048576).toFixed(1)),
      replicaMB: Number(((m.replicaDiskBytes || 0) / 1048576).toFixed(1)),
    };
  });

  const activeChartData = showAll ? chartData : chartData.slice(-20);

  const allValues = activeChartData.flatMap((m) => [
    m.cpuUsage ?? 0,
    m.ramUsagePercentage ?? 0,
    m.ingestMB ?? 0,
    m.replicaMB ?? 0,
  ]);
  const maxReached = allValues.length > 0 ? Math.max(...allValues, 1) : 1;
  const dynamicDomainMax = Math.ceil(maxReached * 1.1);

  return (
    <div className="bg-slate-900 border border-slate-700/80 p-4 rounded-xl flex flex-col gap-2 w-full shadow-lg shadow-slate-950/40">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
        <span className="text-sm font-semibold text-slate-200">
          Vista Global del Clúster{" "}
          <span className="text-xs text-purple-400 font-normal ml-2">
            (Métrica Promedio / Todos los Nodos)
          </span>
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              showAll
                ? "bg-purple-500/10 border-purple-500 text-purple-400"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {showAll ? "Histórico Completo" : "Últimos 20"}
          </button>
          <span className="text-xs font-mono text-slate-400">
            Cluster Aggregated
          </span>
        </div>
      </div>

      <div className={`w-full ${height} min-h-62.5 relative`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeChartData}>
            <defs>
              <linearGradient id="colorCpuGlobal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRamGlobal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="colorIngestGlobal"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="colorReplicaGlobal"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timestamp"
              stroke="#64748b"
              tickFormatter={(t) =>
                t
                  ? t.includes("T")
                    ? t.split("T")[1]?.substring(0, 5)
                    : t
                  : ""
              }
            />
            <YAxis
              stroke="#64748b"
              domain={[0, dynamicDomainMax]}
              tick={(props) => {
                const { x, y, payload } = props;
                const isMax = payload.value === dynamicDomainMax;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={-10}
                      y={4}
                      fill={isMax ? "#a3c6ff" : "#64748b"}
                      fontWeight={isMax ? "bold" : "normal"}
                      fontSize={isMax ? 12 : 11}
                      textAnchor="end"
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
              }}
            />
            <Area
              type="monotone"
              dataKey="cpuUsage"
              name="CPU (%)"
              stroke="#10b981"
              fill="url(#colorCpuGlobal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="ramUsagePercentage"
              name="RAM (%)"
              stroke="#3b82f6"
              fill="url(#colorRamGlobal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="ingestMB"
              name="Búfer Ingesta (MB)"
              stroke="#f59e0b"
              fill="url(#colorIngestGlobal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="replicaMB"
              name="Almacenamiento Réplica (MB)"
              stroke="#a855f7"
              fill="url(#colorReplicaGlobal)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}