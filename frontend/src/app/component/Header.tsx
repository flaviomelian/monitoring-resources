"use client";

import { Layers, LogOut, LayoutDashboard, CheckSquare, FileText, FolderUp, Server, BookOpen, ExternalLink, Monitor } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    const adminCheck = userRole === "ROLE_ADMIN";
    setIsAdmin(adminCheck);

    if (pathname === "/dashboard" && !adminCheck) 
      router.push("/kanban");
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  const allNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-indigo-400", adminOnly: true },
    { href: "/kanban", label: "Kanban", icon: CheckSquare, color: "text-amber-400", adminOnly: false },
    { href: "/notes", label: "Notas", icon: FileText, color: "text-violet-400", adminOnly: false },
    { href: "/files", label: "Archivos", icon: FolderUp, color: "text-emerald-400", adminOnly: false },
    { href: "/services", label: "Servicios", icon: Server, color: "text-blue-400", adminOnly: false },
  ];

  // Filtramos los elementos del menú: si requiere ser admin y no lo es, se oculta
  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 w-full">
      <div className="flex items-center gap-3">
        <Layers className="text-purple-400 h-8 w-8 flex-shrink-0 animate-pulse" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Cluster Infrastructure Monitor
          </h1>
          <p className="text-slate-400 text-xs md:text-sm">
            Red Interna: <code className="text-purple-300 font-mono bg-purple-950/40 px-1 py-0.5 rounded border border-purple-900/30">monitor-net</code> | Topología: Replicación Distribuida en Abanico (Fan-Out) con Delay Controlado
          </p>
        </div>
      </div>

      {/* Navegación rápida y Cierre de sesión */}
      <div className="flex items-center gap-2 flex-wrap">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname === href;
          return (
            <Link 
              key={href}
              href={href} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                isActive 
                  ? "bg-slate-800 border-slate-700 text-white shadow-sm ring-1 ring-slate-700" 
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
              }`}
            >
              <Icon size={20} className={color} />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Enlace interno a la documentación del Frontend */}
        <Link 
          href="/frontend-doc" 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
            pathname === "/frontend-doc" 
              ? "bg-slate-800 border-slate-700 text-white shadow-sm ring-1 ring-slate-700" 
              : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
          }`}
          title="Documentación del Frontend"
        >
          <Monitor size={20} className="text-cyan-400" />
          <span>Docs Cliente</span>
        </Link>

        {/* Enlace externo a la documentación de Swagger con indicador de salida */}
        <a 
          href="http://localhost:8081/swagger-ui/index.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 text-xs font-medium transition group"
          title="Documentación de la API (Swagger)"
        >
          <BookOpen size={20} className="text-pink-400" />
          <span>Swagger</span>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-slate-300 transition" />
        </a>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-xs font-medium text-red-400 transition ml-2"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}