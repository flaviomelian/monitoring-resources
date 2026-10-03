"use client";

import Link from "next/link";
import { ShieldCheck, Server, Cpu, ArrowRight } from "lucide-react";

export default function HomeLanding() {
  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden flex flex-col justify-between selection:bg-blue-500 selection:text-white">

      {/* Barra de navegación superior */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-2 py-6 flex items-center justify-evenly group cursor-pointer">
        <div className="relative w-10 h-10 lg:w-15 lg:h-15 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/30 flex items-center justify-center overflow-hidden transition-all duration-700 ease-out group-hover:shadow-cyan-500/50 group-hover:scale-[1.02]">
          {/* Capa de gradiente secundaria para un fundido de iluminación suave */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out" />

          <Server className="relative z-10 w-5 h-5 text-white transition-transform duration-700 ease-out group-hover:scale-105" />
        </div>

        {/* Contenedor de texto con fundido cruzado suave */}
        <div className="relative font-bold tracking-tight text-xl">
          {/* Texto base (Blanco a Azul) */}
          <span className="bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent transition-opacity duration-700 ease-out group-hover:opacity-0">
            DockStream
          </span>
          {/* Texto alternativo en hover (Azul claro a Blanco) con fundido de entrada */}
          <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100">
            DockStream
          </span>
        </div>
      </header>

      {/* Contenido Principal / Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24 text-center flex-grow flex flex-col items-center justify-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-semibold mb-8 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>Infraestructura Segura & Monitoreo en Tiempo Real</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Control total de tus{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            servicios y clústeres
          </span>{" "}
          desde cualquier lugar.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
          DockStream conecta tus contenedores Docker, métricas de rendimiento y
          entornos de desarrollo en una plataforma unificada, privada y
          accesible vía Tailscale.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
          >
            <span>Crear Cuenta Gratis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 rounded-xl font-semibold transition text-gray-300 hover:text-white flex items-center justify-center"
          >
            Acceder al Sistema
          </Link>
        </div>

        {/* Tarjetas de características rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-sm hover:border-blue-500/40 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Clústeres Docker
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Gestiona contenedores distribuidos, réplicas dinámicas y bases de
              datos con telemetría en vivo.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-sm hover:border-indigo-500/40 transition">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Túneles Seguros
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Acceso cifrado de extremo a extremo mediante Tailscale sin exponer
              puertos críticos a la web abierta.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-sm hover:border-cyan-500/40 transition">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Nativo & Móvil</h3>
            <p className="mt-2 text-sm text-gray-400">
              Compatible con compilación nativa en Android vía Capacitor para
              supervisar métricas sobre la marcha.
            </p>
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-gray-900 text-center text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} DockStream. Entorno de monitoreo privado.
        </p>
      </footer>
    </div>
  );
}
