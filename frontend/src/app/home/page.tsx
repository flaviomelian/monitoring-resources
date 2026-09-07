// frontend/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { Server, Activity, Cpu, HardDrive, ShieldCheck, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();

  // Validación inicial síncrona sin necesidad de efectos ni setState posterior
  const [authorized] = useState(() => {
    if (typeof window === 'undefined') return false;
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (!token || role === 'ROLE_ADMIN') {
      window.location.href = role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/login';
      return false;
    }
    return true;
  });

  const [userEmail] = useState(() => {
    if (typeof window === 'undefined') return 'Usuario Estándar';
    return localStorage.getItem('email') || 'Usuario Estándar';
  });

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-800 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Panel de Consumo</h1>
              <p className="text-xs text-gray-400">Supervisión de servicios y contenedores asignados (`ROLE_USER`)</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl transition hover:border-gray-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Tarjetas de estado rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Estado de Red</span>
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-lg font-bold text-green-400">Conectado</div>
            <p className="text-[11px] text-gray-500 mt-1">Túnel seguro activo</p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Carga de CPU (Cluster)</span>
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold">14.2%</div>
            <p className="text-[11px] text-gray-500 mt-1">Uso óptimo compartido</p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Memoria RAM</span>
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold">4.8 GB / 32 GB</div>
            <p className="text-[11px] text-gray-500 mt-1">Disponibilidad alta</p>
          </div>
        </div>

        {/* Listado de Contenedores Disponibles para Consumo */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Contenedores Activos Disponibles</span>
            </h2>
            <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800/50 font-medium">
              Solo Lectura
            </span>
          </div>

          <div className="space-y-3">
            {/* Ejemplo de contenedor 1 */}
            <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <div className="text-xs font-semibold text-gray-200">nginx-proxy-service</div>
                  <div className="text-[11px] text-gray-500">Puerto: 80 | Protocolo: HTTP</div>
                </div>
              </div>
              <span className="text-[11px] text-green-400 bg-green-950/40 border border-green-900/50 px-2.5 py-1 rounded-lg">
                Ejecutándose
              </span>
            </div>

            {/* Ejemplo de contenedor 2 */}
            <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <div className="text-xs font-semibold text-gray-200">redis-cache-cluster</div>
                  <div className="text-[11px] text-gray-500">Puerto: 6379 | Protocolo: TCP</div>
                </div>
              </div>
              <span className="text-[11px] text-green-400 bg-green-950/40 border border-green-900/50 px-2.5 py-1 rounded-lg">
                Ejecutándose
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}