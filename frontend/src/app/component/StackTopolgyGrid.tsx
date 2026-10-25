import React from "react";
import { FileCode, ExternalLink, HardDrive } from "lucide-react";
import { AppStack, SiteInfo } from "../types";

interface Props {
  stacks: AppStack[];
  sites: Record<string, SiteInfo[]>;
  nodeFromName: (name: string) => string;
  isDatabaseContainer: (name: string) => boolean;
  onOpenSite: (node: string, app: string) => void;
}

export function StackTopologyGrid({ stacks, sites, nodeFromName, isDatabaseContainer, onOpenSite }: Props) {
  if (stacks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
        No se detectaron servicios en la malla. Comprueba que el backend y Tailscale estén operativos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Topología de Stacks e Infraestructura</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stacks.map((stack, sIdx) => (
          <div key={sIdx} className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-slate-700 transition">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white text-base">{stack.stackName}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {stack.containers.length} serv.
                </span>
              </div>
              <p className="text-xs text-slate-400">{stack.description}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              {stack.containers.map((container, cIdx) => {
                const physicalNode = nodeFromName(container.name);
                const nodeSites = sites[physicalNode] ?? [];

                return (
                  <div key={cIdx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${container.state === "running" ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-amber-500"}`}></span>
                        <span className="text-xs font-medium text-slate-200 truncate">{container.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {container.port && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                            :{container.port}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Indicador transparente del nodo físico y volumen asociado */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/90 px-2 py-1 rounded-md border border-slate-800/80 font-mono">
                      <span className="flex items-center gap-1 text-indigo-400">
                        <HardDrive size={10} /> Nodo Almacenamiento:
                      </span>
                      <span className="text-amber-400 font-bold uppercase">{physicalNode}</span>
                    </div>

                    {/* Listado de Proyectos HTML/Web alojados en el volumen de este nodo */}
                    {!isDatabaseContainer(container.name) && nodeSites.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-900">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Sitios en volumen:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {nodeSites.map((site) => (
                            <button
                              key={site.name}
                              onClick={() => onOpenSite(physicalNode, site.name)}
                              title={`Abrir ${site.name} desde el nodo ${physicalNode}`}
                              className="px-2 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 transition flex items-center gap-1 text-[10px]"
                            >
                              <FileCode size={12} />
                              <span className="max-w-[100px] truncate">{site.name}</span>
                              <ExternalLink size={10} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}