"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Server, ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    console.log("¡Iniciando sesión de forma explícita!");
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Respuesta del servidor:", data);

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        const role = data.role ? data.role.toUpperCase() : "";

        if (role.includes("ADMIN")) window.location.href = "/dashboard";
        else window.location.href = "/services";
        
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "Credenciales incorrectas.",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error en el fetch:", error);
      setStatusMessage({
        type: "error",
        text: "Error de conexión con el servidor backend.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 overflow-hidden selection:bg-blue-500 selection:text-white">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>
      <Link href="/" className="group inline-block">
        <div className="relative z-10 mb-8 flex items-center space-x-3 transition-transform duration-300 group-hover:scale-105">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:shadow-blue-500/50 group-hover:rotate-6">
            <Server className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent transition-opacity duration-300 group-hover:opacity-90">
            DockStream
          </span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl shadow-2xl shadow-black/50">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold tracking-tight">Iniciar Sesión</h2>
          <p className="text-xs text-gray-400 mt-1">
            Introduce tus credenciales para acceder al clúster.
          </p>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl text-xs bg-red-950/40 border border-red-800/60 text-red-300">
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@dominio.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-950/80 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-gray-950/80 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/recuperar"
              className="text-xs text-blue-400 hover:text-blue-300 transition"
            >
              ¿Has olvidado la contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-semibold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>{loading ? "Comprobando..." : "Iniciar Sesión"}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            ¿No tienes una cuenta?{" "}
            <Link href="/signup" className="text-blue-400 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
