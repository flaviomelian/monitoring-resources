package com.flavio.backend.config;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.CloseStatus;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;

public class TerminalWebSocketHandler extends TextWebSocketHandler {

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        try {
            System.out.println("🔌 [WS] Nueva conexión recibida. ID de sesión: " + session.getId());

            // Lanzamos la shell interactiva de Alpine
            ProcessBuilder pb = new ProcessBuilder("sh");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            PrintWriter writer = new PrintWriter(process.getOutputStream(), true);

            session.getAttributes().put("process", process);
            session.getAttributes().put("writer", writer);

            // Hilo para leer la salida de la shell línea por línea y enviarla al cliente
            // ... dentro del afterConnectionEstablished ...
            // Solo arranca el hilo de lectura.
            // Hilo dedicado a leer la salida de la shell de forma fluida (sin bloquearse
            // por falta de \n)
            new Thread(() -> {
                try {
                    char[] buffer = new char[1024];
                    int read;
                    while ((read = reader.read(buffer)) != -1) {
                        if (session.isOpen()) {
                            String response = new String(buffer, 0, read);
                            session.sendMessage(new TextMessage(response));
                        }
                    }
                } catch (Exception e) {
                    // El proceso o la sesión terminaron
                }
            }).start();

            // Damos un pequeño respiro y enviamos el prompt inicial
            Thread.sleep(100);
            writer.println("export PS1='\\u@container:\\w\\$ '");
            writer.println("clear");
            writer.flush();

            System.out.println("✅ [WS] Shell y prompt inicializados correctamente.");

        } catch (Exception e) {
            System.err.println("❌ [WS Error] Fallo al iniciar el proceso de terminal:");
            e.printStackTrace();
            try {
                session.close(CloseStatus.SERVER_ERROR);
            } catch (Exception ignored) {
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String payload = message.getPayload();
            System.out.println("📥 [WS In recibido desde React]: " + payload);

            PrintWriter writer = (PrintWriter) session.getAttributes().get("writer");
            if (writer != null) {
                writer.print(payload);
                writer.flush();
            } else {
                System.err.println("❌ [WS Error] El escritor (writer) es nulo en esta sesión.");
            }
        } catch (Exception e) {
            System.err.println("❌ [WS Error] Fallo al escribir en la terminal: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        System.out
                .println("⚠️ [WS] Conexión cerrada. Código: " + status.getCode() + " - Motivo: " + status.getReason());
        try {
            Process process = (Process) session.getAttributes().get("process");
            if (process != null) {
                process.destroy();
            }
        } catch (Exception ignored) {
        }
    }
}