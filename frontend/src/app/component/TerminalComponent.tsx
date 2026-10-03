"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

export const TerminalComponent = ({ nodeId }: { nodeId: number }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const termInstance = useRef<Terminal | null>(null);
  const wsInstance = useRef<WebSocket | null>(null);
  const [pwd, setPwd] = useState("/app");
  
  const pwdRef = useRef("/app");

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

      const wsUrl = `ws://despacho-desktop-3basi77.tail645042.ts.net:${nodeId}/terminal`;
      const ws = new WebSocket(wsUrl);
      wsInstance.current = ws;

      const linuxCommands = new Set([
        "ls", "cd", "pwd", "mkdir", "rm", "cp", "mv", "cat", "grep",
        "find", "chmod", "chown", "ps", "top", "kill", "df", "du",
        "tar", "zip", "unzip", "curl", "wget", "ssh", "scp", "git",
        "docker", "docker-compose", "systemctl", "journalctl", "nano",
        "vim", "clear", "cls", "apk"
      ]);

      let currentCommand = "";

      const renderPrompt = (typingCommand: string = "") => {
        const currentPath = pwdRef.current;
        const parts = typingCommand.trim().split(/\s+/);
        const baseCmd = parts[0] || "";
        const args = typingCommand.slice(baseCmd.length);

        const isKnown = linuxCommands.has(baseCmd);
        const coloredCmd = isKnown
          ? `\x1b[38;5;214m${baseCmd}\x1b[0m${args}`
          : `\x1b[37m${typingCommand}\x1b[0m`;

        const promptPrefix =
          "\x1b[38;5;48m$\x1b[0m" +
          "\x1b[38;5;213mroot\x1b[0m" +
          "\x1b[33m@\x1b[0m" +
          "\x1b[33m:\x1b[0m" +
          "\x1b[38;5;75m" + currentPath + "\x1b[0m" +
          "\x1b[38;5;48m#> \x1b[0m";

        return promptPrefix + coloredCmd;
      };

      // Interceptor de eventos de teclado personalizados para xterm.js
      term.attachCustomKeyEventHandler((event) => {
        if (event.type === "keydown") {
          // Ctrl + C: Envía SIGINT (\x03) para abortar el proceso bloqueado y reinicia el buffer local
          if (event.ctrlKey && event.key.toLowerCase() === "c") {
            event.preventDefault();
            if (ws.readyState === WebSocket.OPEN) {
              ws.send("\x03");
              currentCommand = "";
              term.write("^C\r\n");
              term.write(renderPrompt(""));
            }
            return false;
          }

          // Shift + Insert: Pega el contenido del portapapeles en la línea de comandos actual
          if (event.shiftKey && (event.key === "Insert" || event.code === "Insert")) {
            event.preventDefault();
            navigator.clipboard
              .readText()
              .then((text) => {
                if (text && ws.readyState === WebSocket.OPEN) {
                  currentCommand += text;
                  term.write("\r\x1b[K" + renderPrompt(currentCommand));
                }
              })
              .catch((err) => {
                console.error("Error al acceder al portapapeles:", err);
              });
            return false;
          }
        }
        return true;
      });

      // Refuerzo DOM directo para capturar Shift+Insert / Ctrl+C si xterm pierde el foco de eventos globales
      const handleDomKeyDown = (e: KeyboardEvent) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        if (e.ctrlKey && e.key.toLowerCase() === "c") {
          e.preventDefault();
          e.stopPropagation();
          ws.send("\x03");
          currentCommand = "";
          term.write("^C\r\n");
          term.write(renderPrompt(""));
        } else if (e.shiftKey && (e.key === "Insert" || e.code === "Insert")) {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard
            .readText()
            .then((text) => {
              if (text) {
                currentCommand += text;
                term.write("\r\x1b[K" + renderPrompt(currentCommand));
              }
            })
            .catch((err) => console.error("Error al leer portapapeles DOM:", err));
        }
      };

      const currentElement = terminalRef.current;
      if (currentElement) {
        currentElement.addEventListener("keydown", handleDomKeyDown);
      }

      ws.onopen = () => {
        if (!isMounted) return;
        term.writeln("\x1b[32mConnected to container shell...\x1b[0m");

        ws.send("stty -echo\n");
        ws.send("alias ls='ls --color=always'\n");
        ws.send("clear\n");
        term.write(renderPrompt(""));
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;

        const data = event.data;

        if (data.includes("|||PWD_RESP:")) {
          const parts = data.split("|||PWD_RESP:");
          const cleanOutput = parts[0];
          const pathRes = parts[1].split("|||")[0].trim();

          pwdRef.current = pathRes;
          setPwd(pathRes);

          if (cleanOutput.trim()) {
            term.write(cleanOutput.replace(/\r?\n/g, "\r\n") + "\r\n");
          }
          term.write(renderPrompt(""));
          return;
        }

        term.write(data.replace(/\r?\n/g, "\r\n"));
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
        if (charCode === 127 || charCode === 8 || data === "\u007f") {
          if (currentCommand.length > 0) {
            currentCommand = currentCommand.slice(0, -1);
            term.write("\r\x1b[K" + renderPrompt(currentCommand));
          }
          return;
        }

        // 2. Tabulador
        if (charCode === 9) {
          return;
        }

        // 3. Enter
        if (data === "\r" || data === "\n") {
          term.write("\r\n");
          
          const trimmed = currentCommand.trim();
          if (trimmed === "clear") {
            term.clear();
            ws.send("clear\n");
            term.write(renderPrompt(""));
          } else if (trimmed !== "") {
            ws.send(currentCommand + "\n");
            ws.send('echo "|||PWD_RESP:$(pwd)|||"\n');
          } else {
            term.write(renderPrompt(""));
          }

          currentCommand = "";
          return;
        }

        // 4. Caracteres normales
        if (data.length === 1 && charCode >= 32 && charCode <= 126) {
          currentCommand += data;
          term.write("\r\x1b[K" + renderPrompt(currentCommand));
        }
      });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (terminalRef.current) {
        terminalRef.current.removeEventListener("keydown", () => {});
      }
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
      tabIndex={0}
      className="h-full w-full min-h-[350px] overflow-y-auto focus:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#09090b] [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700"
    />
  );
};