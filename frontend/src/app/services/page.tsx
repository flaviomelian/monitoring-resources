"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  FolderUp,
  Calendar as CalendarIcon,
  Settings,
  Search,
  Bell,
  Plus,
  MoreVertical,
  Paperclip,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Menu,
  X,
  User,
  Download,
} from "lucide-react";
import Header from "../component/Header";

// Tipos de datos para el dashboard
interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  tag: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  content?: string; // Contenido simulado o en base64 para archivos creados localmente
}

export default function UserHubDashboard() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "kanban" | "notes" | "files"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados interactivos para las herramientas
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Actualizar arquitectura del backend en Spring Boot",
      status: "in_progress",
      priority: "high",
      tag: "Backend",
    },
    {
      id: "2",
      title: "Configurar contenedores Docker Compose",
      status: "done",
      priority: "medium",
      tag: "DevOps",
    },
    {
      id: "3",
      title: "Revisar logs de producción y métricas de Grafana",
      status: "todo",
      priority: "high",
      tag: "Monitor",
    },
    {
      id: "4",
      title: "Diseñar interfaz responsive para panel de usuario",
      status: "in_progress",
      priority: "medium",
      tag: "Frontend",
    },
  ]);

  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Credenciales de acceso local",
      content:
        "Recordar actualizar las variables de entorno para la base de datos de pruebas.",
      date: "07 Sep 2026",
    },
    {
      id: "2",
      title: "Ideas para el próximo sprint",
      content:
        "Implementar autenticación basada en roles y optimizar consultas SQL.",
      date: "05 Sep 2026",
    },
  ]);

  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "docker-compose-prod.yml",
      size: "4.2 KB",
      type: "yml",
      date: "06 Sep 2026",
      content:
        "version: '3.8'\nservices:\n  app:\n    image: node:18\n    ports:\n      - \"3000:3000\"",
    },
    {
      id: "2",
      name: "arquitectura_sistema.pdf",
      size: "2.4 MB",
      type: "pdf",
      date: "04 Sep 2026",
      content: "Documento de Arquitectura de Sistema - Workspace Hub",
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Manejadores de acciones
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: "todo",
      priority: "medium",
      tag: "General",
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  const moveTask = (id: string, status: "todo" | "in_progress" | "done") => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      date: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
    setNotes([newNote, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        const fileContent = (event.target?.result as string) || "";
        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.name.split(".").pop() || "file",
          date: new Date().toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          content: fileContent,
        };
        setFiles([newFile, ...files]);
      };

      if (
        file.type.startsWith("text/") ||
        file.name.endsWith(".yml") ||
        file.name.endsWith(".json") ||
        file.name.endsWith(".txt")
      ) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  };

  // Función de descarga corregida
  const handleDownload = (file: UploadedFile) => {
    let blob: Blob;

    if (file.content && file.content.startsWith("data:")) {
      const parts = file.content.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime =
        file.type || (mimeMatch ? mimeMatch[1] : "application/octet-stream");

      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      let mimeType = "text/plain;charset=utf-8";
      if (file.type === "pdf") mimeType = "application/pdf";
      else if (file.type === "yml" || file.type === "yaml")
        mimeType = "text/yaml;charset=utf-8";
      else if (file.type === "json")
        mimeType = "application/json;charset=utf-8";

      blob = new Blob([file.content || ""], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-950 font-sans">
        <div className="p-8">
            <Header />
        </div>
      {/* Contenido principal */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header superior */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3 w-full max-w-md">
            <Search size={18} className="text-slate-500" />
            <input
              type="text"
              placeholder="Buscar tareas, notas o archivos..."
              className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-500 w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500"></span>
            </button>
          </div>
        </header>

        {/* Cuerpo dinámico según pestaña */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* PESTAÑA: DASHBOARD GENERAL */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Vista General
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Resumen rápido de tus actividades y accesos directos.
                </p>
              </div>

              {/* Tarjetas de métricas rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Tareas Totales
                    </span>
                    <CheckSquare size={18} className="text-indigo-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {tasks.length}
                  </div>
                  <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1">
                    <span className="font-medium">
                      {tasks.filter((t) => t.status === "done").length}
                    </span>{" "}
                    completadas
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Bloc de Notas
                    </span>
                    <FileText size={18} className="text-violet-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {notes.length}
                  </div>
                  <p className="text-xs text-violet-400 mt-2">
                    Notas guardadas
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Archivos
                    </span>
                    <FolderUp size={18} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {files.length}
                  </div>
                  <p className="text-xs text-emerald-400 mt-2">
                    Documentos subidos
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Estado del Sistema
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <div className="text-3xl font-bold text-white">Online</div>
                  <p className="text-xs text-emerald-400 mt-2">
                    Servicios operativos
                  </p>
                </div>
              </div>

              {/* Secciones secundarias en el dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Tareas pendientes recientes */}
                <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white text-sm">
                      Tareas en Curso
                    </h3>
                    <button
                      onClick={() => setActiveTab("kanban")}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Ver todas
                    </button>
                  </div>
                  <div className="space-y-3">
                    {tasks
                      .filter((t) => t.status !== "done")
                      .slice(0, 3)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <Clock size={16} className="text-amber-400" />
                            <span className="text-sm font-medium text-slate-200">
                              {task.title}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {task.tag}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Notas rápidas recientes */}
                <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white text-sm">
                      Últimas Notas
                    </h3>
                    <button
                      onClick={() => setActiveTab("notes")}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Ver todas
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notes.slice(0, 2).map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-medium text-slate-200">
                            {note.title}
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            {note.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: KANBAN / TAREAS */}
          {activeTab === "kanban" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Tablero Kanban
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Organiza tus tareas y pendientes de forma visual.
                  </p>
                </div>

                {/* Formulario rápido para añadir tarea */}
                <form onSubmit={addTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nueva tarea..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Plus size={16} />
                    <span>Añadir</span>
                  </button>
                </form>
              </div>

              {/* Columnas Kanban Responsive */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna: Por hacer */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      Por Hacer (
                      {tasks.filter((t) => t.status === "todo").length})
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {tasks
                      .filter((t) => t.status === "todo")
                      .map((task) => (
                        <div
                          key={task.id}
                          className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-2 group"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                              {task.tag}
                            </span>
                            <button
                              onClick={() => moveTask(task.id, "in_progress")}
                              className="text-xs text-indigo-400 hover:underline font-medium"
                            >
                              Avanzar &rarr;
                            </button>
                          </div>
                          <p className="text-sm font-medium text-slate-200">
                            {task.title}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Columna: En progreso */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                      En Progreso (
                      {tasks.filter((t) => t.status === "in_progress").length})
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {tasks
                      .filter((t) => t.status === "in_progress")
                      .map((task) => (
                        <div
                          key={task.id}
                          className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-2 group"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                              {task.tag}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => moveTask(task.id, "todo")}
                                className="text-xs text-slate-500 hover:text-white"
                              >
                                &larr;
                              </button>
                              <button
                                onClick={() => moveTask(task.id, "done")}
                                className="text-xs text-emerald-400 hover:underline font-medium"
                              >
                                &rarr;
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-slate-200">
                            {task.title}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Columna: Completado */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      Completado (
                      {tasks.filter((t) => t.status === "done").length})
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {tasks
                      .filter((t) => t.status === "done")
                      .map((task) => (
                        <div
                          key={task.id}
                          className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-2 opacity-75"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              {task.tag}
                            </span>
                            <button
                              onClick={() => moveTask(task.id, "in_progress")}
                              className="text-xs text-slate-500 hover:text-white"
                            >
                              &larr; Reabrir
                            </button>
                          </div>
                          <p className="text-sm font-medium text-slate-200 line-through">
                            {task.title}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: BLOC DE NOTAS */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Bloc de Notas
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Anota ideas rápidas, fragmentos de código o recordatorios.
                </p>
              </div>

              {/* Formulario para nueva nota */}
              <form
                onSubmit={addNote}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4"
              >
                <h3 className="text-sm font-semibold text-white">
                  Crear Nueva Nota
                </h3>
                <input
                  type="text"
                  placeholder="Título de la nota..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  placeholder="Escribe el contenido aquí..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Plus size={16} />
                    <span>Guardar Nota</span>
                  </button>
                </div>
              </form>

              {/* Listado de notas en rejilla */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4 group hover:border-slate-700 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-white text-sm">
                          {note.title}
                        </h4>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-slate-500 hover:text-red-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                      {note.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PESTAÑA: ARCHIVOS Y RECURSOS */}
          {activeTab === "files" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Archivos y Recursos
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Sube y centraliza documentos importantes o configuraciones.
                </p>
              </div>

              {/* Zona de Subida de Archivos */}
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 rounded-2xl p-8 text-center transition flex flex-col items-center justify-center gap-3 relative">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FolderUp size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Arrastra tus archivos aquí o haz clic para buscar
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Soporta configuraciones, scripts, imágenes o documentos
                    (PDF, YML, etc.)
                  </p>
                </div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Lista de archivos subidos */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-semibold text-white text-sm">
                    Archivos Disponibles ({files.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-800">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold uppercase text-xs">
                          {file.type}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {file.size} &bull; {file.date}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 transition flex items-center gap-2 text-xs font-medium"
                      >
                        <Download size={16} />
                        <span className="hidden sm:inline">Descargar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
