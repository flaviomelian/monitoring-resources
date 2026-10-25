"use client";

import { useState, useEffect } from "react";
import { User, Shield, Terminal, Activity, LogOut, CheckCircle2 } from "lucide-react";
import Header from "../component/Header";

export default function UserProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceMessage, setServiceMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        
        // Petición real al endpoint de Spring Boot (asegúrate de que el puerto sea el correcto, ej. 8081)
        const res = await fetch("http://localhost:8081/api/user/profile", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) {
          throw new Error("No se pudo autenticar o cargar la información del perfil.");
        }
        
        const data = await res.json();
        
        // Mapeamos lo que devuelve el UserProfileResponse de Java
        setProfile({
          email: data.email,
          role: data.role,
          status: data.status || "Operational"
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleConsumeServices = async () => {
    try {
      const res = await fetch("http://localhost:8081/api/containers/consume", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.text();
      setServiceMessage(data);
    } catch (err) {
      setServiceMessage("Error al conectar con los servicios de la malla.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-mono text-xs">
        <span className="animate-pulse">Cargando telemetría de usuario desde el nodo...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-6 relative overflow-hidden">
      
      {/* Fondo estético con orbes y malla idénticos al layout */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 -left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>
      
      <Header />

      <div className="mt-10 relative z-10 max-w-4xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
              <User className="text-indigo-400" size={20} />
              Panel de Usuario / Operador
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Gestión de identidad y consumo de servicios de red interna.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-mono">
              <CheckCircle2 size={12} />
              {profile?.status || "Active"}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-xs font-mono">
            Error de autenticación: {error}
          </div>
        )}

        {/* Tarjetas de Información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Credenciales e Identidad */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md space-y-4 shadow-xl">
            <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Terminal size={14} className="text-slate-500" />
              Credenciales de Sesión
            </h2>
            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Correo Electrónico:</span>
                <span className="text-slate-200">{profile?.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Rol Asignado:</span>
                <span className="text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/50">
                  {profile?.role || "ROLE_USER"}
                </span>
              </div>
            </div>
          </div>

          {/* Consumo de Contenedores y Servicios */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md space-y-4 shadow-xl">
            <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Activity size={14} className="text-indigo-400" />
              Acceso a la Red Interna
            </h2>
            <p className="text-xs text-slate-400">
              Verifica los permisos de consumo sobre los data-nodes y la telemetría activa del clúster.
            </p>
            <button
              onClick={handleConsumeServices}
              className="w-full mt-2 py-2 px-4 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-600/20"
            >
              Consultar Métrica de Contenedores
            </button>
            {serviceMessage && (
              <div className="mt-3 p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400">
                &gt; {serviceMessage}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}