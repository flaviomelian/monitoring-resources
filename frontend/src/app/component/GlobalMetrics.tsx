import { Cpu, Server, HardDrive } from "lucide-react";
import { Metric } from "../types";

interface Props {
  latest: Metric;
}

export default function GlobalMetrics({ latest }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-500">
        Métricas Globales de la Infraestructura
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Uso CPU Global</p>
            <h3 className="text-2xl md:text-3xl font-black mt-1 text-emerald-400">
              {latest.cpuUsage}%
            </h3>
          </div>
          <Cpu className="text-slate-700 h-10 w-10 stroke-[1.5]" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Memoria RAM Host</p>
            <h3 className="text-2xl md:text-3xl font-black mt-1 text-blue-400">
              {latest.ramUsedGB} / {latest.ramTotalGB} GB
            </h3>
          </div>
          <Server className="text-slate-700 h-10 w-10 stroke-[1.5]" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Almacenamiento Base (Ubuntu)</p>
            <h3 className="text-2xl md:text-3xl font-black mt-1 text-purple-400">
              {latest.diskUsagePercentage}%
            </h3>
          </div>
          <HardDrive className="text-slate-700 h-10 w-10 stroke-[1.5]" />
        </div>
      </div>
    </section>
  );
}