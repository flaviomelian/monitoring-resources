import React from "react";
import { ExternalLink, Server } from "lucide-react";
import { MeshApp } from "../types";

interface Props {
  apps: MeshApp[];
  onOpenApp: (port: string) => void;
}

// Deduce el nodo de almacenamiento / servidor a partir del nombre del contenedor
const nodeFromName = (name: string): string => {
  const m = name.match(/replica-?(\d+)/i);
  return m ? `replica ${m[1]}` : "nodo ingest";
};

export function MeshAppsGrid({ apps, onOpenApp }: Props) {
  if (apps.length === 0) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Aplicaciones</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <div key={app.name} className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-white text-base truncate">{app.name}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${app.healthy ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                {app.healthy ? "Operativa" : "Degradada"}
              </span>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              {app.parts.map((part) => {
                const nodeLabel = nodeFromName(part.name);
                return (
                  <div key={part.name} className="flex items-center justify-between gap-3 text-xs bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${part.state === "running" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                      <div className="min-w-0">
                        <p className="text-slate-200 font-medium truncate">{part.name}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Server size={10} className="text-indigo-400" />
                          <span>{nodeLabel}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
                      {part.role ?? "servicio"}
                    </span>
                  </div>
                );
              })}
            </div>

            {app.web && app.web.port ? (
              <button
                onClick={() => onOpenApp(app.web!.port as string)}
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
              >
                <ExternalLink size={14} />
                <span>Abrir app</span>
              </button>
            ) : (
              <span className="text-center text-[11px] text-slate-500">
                Sin frontend publicado (mesh.role=frontend con puerto)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}