'use client';

import { useState } from "react";
import ReactDOM from "react-dom";
import { Terminal, X } from "lucide-react";
import dynamic from "next/dynamic";

// Importación dinámica excluyendo SSR por completo
const TerminalComponent = dynamic(
  () => import("./TerminalComponent").then((mod) => mod.TerminalComponent),
  { ssr: false }
);

interface Props {
  nodeName: string;
  port: number;
}

export function NodeTerminalModal({ nodeName, port }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const modalContent = isOpen ? (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[99999] p-4">
      <div className="bg-zinc-900 border border-purple-500/50 rounded-xl w-full max-w-3xl h-[480px] shadow-[0_0_25px_rgba(192,132,252,0.15)] flex flex-col overflow-hidden">
        
        {/* Barra superior */}
        <div className="bg-black/80 px-4 py-3 border-b border-zinc-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono text-zinc-300">
              terminal@{nodeName} (Port: {port})
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenedor de la Terminal */}
        <div className="flex-1 p-4 bg-zinc-950 overflow-hidden flex flex-col">
          <TerminalComponent nodeId={port} />
        </div>

      </div>
    </div>
  ) : null;

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-black p-2 rounded-md group border border-black hover:border-purple-500 hover:drop-shadow-[0_0_8px_rgba(192,132,252,0.8)] transition-all duration-200"
        title={`Abrir terminal para ${nodeName}`}
      >
        <Terminal className="w-6 h-6 text-gray-400 hover:text-purple-400 transition-colors" />
      </button>

      {isOpen && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
}