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
  color: string;
}

export function NodeTerminalModal({ nodeName, port, color }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const modalContent = isOpen ? (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[99999] p-4">
      <div 
        className="bg-zinc-900 rounded-xl w-full max-w-3xl h-[480px] flex flex-col overflow-hidden shadow-2xl"
        style={{ borderColor: `${color}80`, borderWidth: '1px', borderStyle: 'solid', boxShadow: `0 0 25px ${color}26` }}
      >
        
        {/* Barra superior */}
        <div className="bg-black/80 px-4 py-3 border-b border-zinc-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" style={{ color }} />
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
        className="bg-black p-2 rounded-md group border border-black transition-all duration-200"
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
        title={`Abrir terminal para ${nodeName}`}
      >
        <Terminal 
          className="w-6 h-6 text-gray-400 transition-colors group-hover:opacity-100" 
          onMouseEnter={(e) => (e.currentTarget.style.color = color)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        />
      </button>

      {isOpen && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
}