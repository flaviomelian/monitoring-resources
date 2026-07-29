"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import GlobalMetrics from "./GlobalMetrics";
import NodesGrid from "./NodesGrid";
import HistoryChart from "./HistoryChart";
import MetricsTable from "./MetricsTable";
import GlobalHistoryChart from "./GlobalHistoryChart";
import { Metric } from "../types";

export type NodeRole = "all" | "master" | "ingesta" | "replica";

export interface ServerNodeData {
  id: number;
  name: string;
  ipAddress: string;
  operatingSystem: string;
  active: boolean;
  metrics: Metric[];
}

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
  const [nodes, setNodes] = useState<ServerNodeData[]>([]);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<NodeRole>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [avgMetric, setAvgMetric] = useState<Metric[]>([]);

  // useEffect 1 y 2: Nodos y sus métricas individuales en paralelo
  useEffect(() => {
    const fetchClusterNodes = async () => {
      try {
        // 1. Obtener la lista de nodos registrados en BD
        const nodesRes = await fetch("http://localhost:8081/api/nodes");
        if (!nodesRes.ok)
          throw new Error(`Error obteniendo nodos: ${nodesRes.status}`);
        const nodesList = (await nodesRes.json()) as ServerNodeData[];

        // 2. Traer las métricas de cada nodo en paralelo usando su ID
        const nodesWithMetrics = await Promise.all(
          nodesList.map(async (node) => {
            try {
              const metricsRes = await fetch(
                `http://localhost:8081/api/metrics/history/${node.id}`
              );
              const metricsData = metricsRes.ok
                ? ((await metricsRes.json()) as Metric[])
                : [];
              return { ...node, metrics: metricsData };
            } catch (err) {
              console.error(
                `Error al cargar métricas para nodo ${node.id}:`,
                err
              );
              return { ...node, metrics: [] };
            }
          })
        );

        setNodes(nodesWithMetrics);
        setLoading(false);
      } catch (err) {
        console.error("Error devorando nodos del backend:", err);
      }
    };

    fetchClusterNodes();
    const interval = setInterval(fetchClusterNodes, 5000);
    return () => clearInterval(interval);
  }, []);

  // Extraer la última métrica global o del nodo ingest
  const latestGlobalMetric =
    avgMetric.length > 0 ? avgMetric[avgMetric.length - 1] : emptyMetric;

  // Filtrar la lista de nodos para renderizar según el rol seleccionado
  const filteredNodes = nodes.filter((node) => {
    if (activeRole === "all") return true;
    const nameLower = node.name.toLowerCase();
    if (activeRole === "ingesta") return nameLower.includes("ingest");
    if (activeRole === "replica") return nameLower.includes("replica");
    if (activeRole === "master")
      return nameLower.includes("master") || nameLower.includes("ingest");
    return true;
  });

  return (
    <div className="p-4 md:p-8 bg-slate-950 text-slate-100 min-h-screen w-full flex justify-center">
      {/* Contenedor centralizado de ancho máximo */}
      <div className="w-full max-w-full space-y-8">
        <Header />

        {/* --- SELECTOR DE FILTRO DE NODO --- */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-400">
              Filtro de Desglose
            </h3>
            <p className="text-xs text-slate-500">
              Aísla el histórico visual por rol de nodo en el clúster
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { role: "all", name: "Todo el Clúster" },
              { role: "master", name: "Nodo Master" },
              { role: "ingesta", name: "Nodos Ingesta" },
              { role: "replica", name: "Nodos Réplica" },
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

        {/* --- DISTRIBUCIÓN EN 2 COLUMNAS (IZQ Y DER) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
          {/* Columna Izquierda */}
          <div className="flex flex-col gap-6 w-full">
            <GlobalMetrics latest={latestGlobalMetric} />
            <NodesGrid latest={latestGlobalMetric} />
          </div>

          {/* Contenedor Principal en Columna */}
          <div className="flex flex-col gap-6 w-full">
            {/* 1. GRÁFICO PRINCIPAL (MEDIA/GLOBAL): Grande y Destacado Arriba */}
            <div className="bg-slate-900 border border-slate-700/80 p-4 rounded-xl flex flex-col gap-2 w-full shadow-lg shadow-slate-950/40">
              <GlobalHistoryChart
                showAll={showAll}
                setShowAll={setShowAll}
                height="h-32"
              />
            </div>
            {/* 2. RESTO DE NODOS: Lista inferior con scroll y tarjetas más pequeñas */}
            {filteredNodes.length > 0 && (
              <div
                className="max-h-115 overflow-y-auto pr-2 w-full custom-scrollbar py-1
  [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]
  [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_2%,black_98%,transparent_100%)]
  [&::-webkit-scrollbar]:w-1.5
  [&::-webkit-scrollbar-track]:bg-slate-950/20
  [&::-webkit-scrollbar-thumb]:bg-slate-800
  [&::-webkit-scrollbar-thumb]:rounded-full
  hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
  [scrollbar-width:thin]
  [scrollbar-color:theme(colors.slate.800)_transparent]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {filteredNodes.map((node) => (
                    <div
                      key={node.id}
                      className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-1.5 opacity-90 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                        <span className="text-xs font-semibold text-slate-300">
                          {node.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {node.ipAddress === '127.0.0.1' ? (`${node.ipAddress} | localhost`) : (node.ipAddress)}
                        </span>
                      </div>
                      <div className="flex-1 min-h-100">
                        <HistoryChart
                          metrics={node.metrics}
                          showAll={showAll}
                          setShowAll={setShowAll}
                          activeRole={activeRole}
                          height="h-32"
                          compact={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <MetricsTable/>
          </div>
        </div>
      </div>
    </div>
  );
}