"use client";

import {
  LogOut,
  LayoutDashboard,
  CheckSquare,
  FileText,
  FolderUp,
  Server,
  BookOpen,
  ExternalLink,
  Monitor,
  User,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import dockstreamLogo from "../img/DockStream-Logo-No-Text.png";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    const adminCheck = userRole === "ROLE_ADMIN";
    setIsAdmin(adminCheck);

    if (pathname === "/dashboard" && !adminCheck) router.push("/kanban");
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  const allNavItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-indigo-400",
      adminOnly: true,
    },
    {
      href: "/kanban",
      label: "Kanban",
      icon: CheckSquare,
      color: "text-amber-400",
      adminOnly: false,
    },
    {
      href: "/notes",
      label: "Notas",
      icon: FileText,
      color: "text-violet-400",
      adminOnly: false,
    },
    {
      href: "/files",
      label: "Archivos",
      icon: FolderUp,
      color: "text-emerald-400",
      adminOnly: false,
    },
    {
      href: "/services",
      label: "Servicios",
      icon: Server,
      color: "text-blue-400",
      adminOnly: false,
    },
  ];

  // Filtramos los elementos del menú: si requiere ser admin y no lo es, se oculta
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 w-full">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="group flex items-center gap-3.5 focus:outline-none"
        >
          <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md transition-all duration-500 group-hover:bg-cyan-400/40" />
            <Image
              src={dockstreamLogo}
              alt="DockStream"
              width={44}
              height={44}
              priority
              className="relative z-10 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="relative flex items-center h-7">
              {/* Texto base (de izq. a der.: Blanco -> Slate -> Cian) */}
              <span className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent transition-opacity duration-700 ease-out group-hover:opacity-0">
                DockStream
              </span>
              {/* Texto antítesis en hover (de der. a izq.: Cian -> Slate -> Blanco) con fundido cruzado suave */}
              <span className="absolute inset-0 flex items-center text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-slate-100 to-white bg-clip-text text-transparent opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100">
                DockStream
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">
              Red Interna:{" "}
              <code className="text-purple-300 font-mono bg-purple-950/40 px-1 py-0.5 rounded border border-purple-900/30">
                monitor-net
              </code>{" "}
              | Topología: Replicación Distribuida en Abanico (Fan-Out) con
              Delay Controlado
            </p>
          </div>
        </Link>
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
          <ExternalLink
            size={14}
            className="text-slate-500 group-hover:text-slate-300 transition"
          />
        </a>

        {/* Enlace interno al perfil */}
        <Link
          href="/profile"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
            pathname === "/profile"
              ? "bg-slate-800 border-slate-700 text-white shadow-sm ring-1 ring-slate-700"
              : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
          }`}
          title="Perfil de Usuario"
        >
          <User size={20} className="text-indigo-400" />
          <span>Perfil</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-xs font-medium text-red-400 transition ml-2 cursor-pointer"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
