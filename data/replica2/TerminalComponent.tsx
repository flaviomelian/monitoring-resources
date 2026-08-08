'use client';
import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export const TerminalComponent = ({ nodeId }: { nodeId: number }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const termInstance = useRef<Terminal | null>(null);
  const wsInstance = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    let isMounted = true;
    let cleanupResize: (() => void) | null = null;

    const timer = setTimeout(() => {
      if (!isMounted || !terminalRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        theme: {
          background: "#09090b",
          foreground: "#f4f4f5",
          cursor: "#c084fc",
          selectionBackground: "rgba(192, 132, 252, 0.3)",
        },
        fontSize: 13,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;

      term.open(terminalRef.current);
      fitAddon.fit(); // ajusta filas/columnas al tamaño real del contenedor
      termInstance.current = term;

      const wsUrl = `ws://localhost:${nodeId}/terminal`;
      const ws = new WebSocket(wsUrl);
      wsInstance.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        term.writeln("\x1b[32mConnected to container shell...\x1b[0m");

        // Prompt dinámico: usuario@directorio_actual
        // \w -> ruta completa del directorio actual (usa ~ para el home)
        // Si prefieres solo el nombre de la carpeta (sin ruta completa), usa \W
        ws.send("export PS1='usuario@\\w:# '\n");
        ws.send("clear\n");
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        term.write(event.data);
      };

      ws.onerror = (error) => {
        if (!isMounted) return;
        console.error("❌ Error en WebSocket:", error);
        term.writeln("\x1b[31m[Error de conexión con el WebSocket]\x1b[0m");
      };

      ws.onclose = (event) => {
        if (!isMounted) return;
        term.writeln(
          `\x1b[33m[Conexión cerrada (Código: ${event.code})]\x1b[0m`
        );
      };

      term.onData((data) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        // Enviamos todo tal cual: la shell remota (pty) se encarga del eco,
        // backspace, tab, etc. No hace falta distinguir casos aquí.
        ws.send(data);
      });

      // Reajusta el terminal si cambia el tamaño de la ventana...
      const handleWindowResize = () => fitAddon.fit();
      window.addEventListener("resize", handleWindowResize);

      // ...o si cambia el tamaño del propio contenedor (p.ej. al reorganizarse
      // el grid/paneles sin que cambie el tamaño de la ventana)
      const resizeObserver = new ResizeObserver(() => fitAddon.fit());
      resizeObserver.observe(terminalRef.current);

      cleanupResize = () => {
        window.removeEventListener("resize", handleWindowResize);
        resizeObserver.disconnect();
      };
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (cleanupResize) cleanupResize();
      if (termInstance.current) {
        termInstance.current.dispose();
        termInstance.current = null;
      }
      if (wsInstance.current) {
        wsInstance.current.close();
        wsInstance.current = null;
      }
    };
  }, [nodeId]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full min-h-[350px] overflow-hidden"
    />
  );
};
