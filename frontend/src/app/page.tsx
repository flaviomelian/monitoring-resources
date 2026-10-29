"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Server, Cpu, ArrowRight } from "lucide-react";
import dockstreamLogo from "./img/DockStream-Logo.png";

export default function HomeLanding() {
  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden flex flex-col justify-between selection:bg-blue-500 selection:text-white">

      {/* Barra de navegación superior / Header centrado */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-10 pb-4 flex items-center justify-center">
        <Link 
          href="/" 
          className="group flex flex-col items-center justify-center cursor-pointer focus:outline-none"
        >
          {/* Contenedor del Isotipo ampliado con efecto Glow proporcional */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
            {/* Halo de luz de fondo gigante que reacciona al Hover */}
            <div className="absolute inset-0 rounded-full bg-cyan-500/25 blur-2xl transition-all duration-700 ease-out group-hover:bg-cyan-400/45 group-hover:blur-3xl" />
            
            <Image
              src={dockstreamLogo}
              alt="DockStream"
              width={160}
              height={160}
              priority
              className="relative z-10 w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105 drop-shadow-[0_0_25px_rgba(34,211,238,0.35)]"
            />
          </div>
        </Link>
      </header>

      {/* Contenido Principal / Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8 md:py-12 text-center flex-grow flex flex-col items-center justify-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-xs font-semibold mb-8 animate-bounce backdrop-blur-md shadow-lg shadow-cyan-950/50">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Infraestructura Segura & Monitoreo en Tiempo Real</span>
        </div>

        <h3 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Control total de sus{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            servicios y clústeres
          </span>{" "}
          desde cualquier lugar.
        </h3>

        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
          DockStream conecta tus contenedores Docker, métricas de rendimiento y
          entornos de desarrollo en una plataforma unificada, privada y
          accesible vía Tailscale.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-semibold shadow-xl shadow-cyan-600/20 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-sm hover:border-cyan-500/40 transition group">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition">
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

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-sm hover:border-blue-500/40 transition group">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition">
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

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-sm hover:border-indigo-500/40 transition group">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition">
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
    </div>
  );
}