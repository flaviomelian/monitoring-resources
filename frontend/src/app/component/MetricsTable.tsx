"use client";

import { useState, useEffect } from "react";
import { Metric } from "../types";

export default function MetricsTable() {
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
        console.error("Error cargando la media del clúster para la tabla:", err);
      }
    };

    fetchAverageMetrics();
    const interval = setInterval(fetchAverageMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Asegurarnos de que trabajamos con un array plano por si viene anidado
  const flatMetrics = Array.isArray(metrics[0])
    ? (metrics as unknown as Metric[][])[0]
    : metrics;
  const reversedMetrics = [...flatMetrics].reverse();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden w-full">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-semibold">Registros del Colector Distribuido</h2>
      </div>

      <div
        className="overflow-x-auto overflow-y-auto h-[400px] custom-scrollbar
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-slate-950/20
        [&::-webkit-scrollbar-thumb]:bg-slate-800
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
        [scrollbar-width:thin]
        [scrollbar-color:theme(colors.slate.800)_transparent]"
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="sticky top-0 bg-slate-900 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800 z-10">
              <th className="p-4 font-medium">Timestamp</th>
              <th className="p-4 font-medium">CPU</th>
              <th className="p-4 font-medium">RAM Host</th>
              <th className="p-4 font-medium">Búfer Ingesta</th>
              <th className="p-4 font-medium">Almacenamiento (Réplicas A y B)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {reversedMetrics.map((m, index) => (
              <tr
                key={m.timestamp || index}
                className="hover:bg-slate-950/30 transition-colors"
              >
                <td className="p-4 font-mono text-slate-300">
                  {m.timestamp
                    ? typeof m.timestamp === "string" &&
                      m.timestamp.includes("T")
                      ? m.timestamp.split("T")[1]?.substring(0, 8) ||
                        m.timestamp
                      : m.timestamp
                    : "N/A"}
                </td>
                <td className="p-4 text-emerald-400 font-medium">
                  {m.cpuUsage}%
                </td>
                <td className="p-4 text-blue-400 font-medium">
                  {m.ramUsedGB} GB
                </td>
                <td className="p-4 text-amber-500 font-mono font-medium">
                  {(((m.ingestDiskBytes as number) || 0) / 1048576).toFixed(1)}{" "}
                  MB
                </td>
                <td className="p-4 text-purple-400 font-mono font-medium">
                  {(((m.replicaDiskBytes as number) || 0) / 1048576).toFixed(1)}{" "}
                  MB
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}