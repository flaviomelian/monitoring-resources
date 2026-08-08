"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

export const TerminalComponent = ({ nodeId }: { nodeId: number }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const termInstance = useRef<Terminal | null>(null);
  const wsInstance = useRef<WebSocket | null>(null);
  const [pwd, setPwd] = useState("\\");

  useEffect(() => {
    let isMounted = true;

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

      term.open(terminalRef.current);
      termInstance.current = term;

      const wsUrl = `ws://localhost:${nodeId}/terminal`;
      const ws = new WebSocket(wsUrl);
      wsInstance.current = ws;

      let currentCommand = "";

      ws.onopen = () => {
        if (!isMounted) return;
        term.writeln("\x1b[32mConnected to container shell...\x1b[0m");

        // Configuramos el PS1 para que la shell imprima el directorio actual (\w) tras la arroba
        ws.send("export PS1='root@\\w \\$ '\n");
        ws.send("clear\n");
        term.write("root@:/app ");
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;

        const data = event.data;

        // Si la respuesta contiene la ruta del pwd oculto, la interceptamos
        if (data.includes("|||PWD_RESP:")) {
          const parts = data.split("|||PWD_RESP:");
          const cleanOutput = parts[0];
          const pathRes = parts[1].split("|||")[0].trim();

          setPwd(pathRes);
          term.write(cleanOutput);
          term.write(`root@:${pathRes}# `);
          return;
        }

        term.write(data);
      };

      ws.onerror = (error) => {
        if (!isMounted) return;
        console.error("❌ Error en WebSocket:", error);
        term.writeln("\x1b[31m[Error de conexión con el WebSocket]\x1b[0m");
      };

      ws.onclose = (event) => {
        if (!isMounted) return;
        term.writeln(
          `\x1b[33m[Conexión cerrada (Código: ${event.code})]\x1b[0m`,
        );
      };

      term.onData((data) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const charCode = data.charCodeAt(0);

        // 1. Borrado (Backspace / Delete)
        if (charCode === 127 || charCode === 8) {
          if (currentCommand.length > 0) {
            currentCommand = currentCommand.slice(0, -1);
            term.write("\b \b");
            ws.send(data);
          }
          return;
        }

        // 2. Tabulador (Autocompletado básico)
        if (charCode === 9) {
          if (currentCommand.startsWith("dock")) {
            const completion = "er-compose ";
            currentCommand += completion;
            term.write("er-compose ");
            ws.send("er-compose ");
          } else {
            ws.send(data);
          }
          return;
        }

        // 3. Enter
        if (data === "\r" || data === "\n") {
          term.write("\r\n");
          ws.send("\n");
          ws.send("echo \"|||PWD_RESP:$(pwd)|||\"\n");
          currentCommand = "";
          return;
        }

        // 4. Caracteres normales
        currentCommand += data;
        term.write(data);
        ws.send(data);
      });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
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
