import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Permite entrar por el nombre de Tailscale (si no, Vite bloquea el host)
    allowedHosts: true,
    // El navegador solo habla con este puerto; /api se reenvía al contenedor de la API
    proxy: {
      "/api": "http://crud-api:3000",
    },
  },
});
