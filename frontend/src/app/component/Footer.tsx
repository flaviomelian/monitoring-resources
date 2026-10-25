import { Activity, ShieldCheck, Terminal } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 backdrop-blur-md py-5 px-6 font-sans text-xs text-slate-400 overflow-hidden">

      {/* Contenido principal encima de los efectos */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Izquierda: Estado de la malla */}
        <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></span>
            <span>
              Mesh Cluster:{" "}
              <span className="text-emerald-400 font-semibold">
                Operational
              </span>
            </span>
          </div>
          <div className="hidden sm:block h-3 w-[1px] bg-slate-800"></div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-slate-300">
            <Activity size={13} className="text-indigo-400" />
            <span>Telemetry: Active</span>
          </div>
        </div>

        {/* Centro: Firma técnica, Copyright y Autor */}
        <div className="flex flex-col items-center justify-center text-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <Terminal size={13} className="text-slate-600" />
            <span className="font-mono text-[11px] tracking-tight text-slate-400 font-medium">
              DockStream &copy; {currentYear} &bull; Distributed Node
              Architecture
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-tight text-slate-500">
            Flavio Melián Santana &bull; Entorno de monitoreo privado
          </span>
        </div>

        {/* Derecha: Seguridad y versión */}
        <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-slate-300">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>TLS 1.3 / Mesh-Secured</span>
          </div>
          <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-500">
            v1.0.0-prod
          </span>
        </div>
      </div>
    </footer>
  );
}
