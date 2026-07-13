import { Layers } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-slate-800 pb-4 w-full">
      <Layers className="text-purple-400 h-8 w-8 flex-shrink-0 animate-pulse" />
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Cluster Infrastructure Monitor
        </h1>
        <p className="text-slate-400 text-xs md:text-sm">
          Red Interna: <code className="text-purple-300 font-mono bg-purple-950/40 px-1 py-0.5 rounded border border-purple-900/30">monitor-net</code> | Topología: Replicación Distribuida en Abanico (Fan-Out) con Delay Controlado
        </p>
      </div>
    </header>
  );
}