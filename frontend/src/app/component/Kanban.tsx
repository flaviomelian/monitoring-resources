"use client";

import React, { useState } from "react";
import { Plus, Trash2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Header from "./Header";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  tag: string;
}

const Kanban = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Auditoría de seguridad en clúster Kubernetes",
      status: "in_progress",
      priority: "high",
      tag: "DevOps",
    },
    {
      id: "2",
      title: "Optimizar consultas SQL en PostgreSQL",
      status: "todo",
      priority: "medium",
      tag: "Database",
    },
    {
      id: "3",
      title: "Configurar métricas en Prometheus y Grafana",
      status: "done",
      priority: "high",
      tag: "Monitor",
    },
  ]);

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("DevOps");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      status: "todo",
      priority,
      tag,
    };

    setTasks([newTask, ...tasks]);
    setTitle("");
  };

  const moveTask = (id: string, newStatus: "todo" | "in_progress" | "done") => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const columns = [
    { id: "todo", title: "Por Hacer", color: "bg-amber-500" },
    { id: "in_progress", title: "En Progreso", color: "bg-indigo-500" },
    { id: "done", title: "Completado", color: "bg-emerald-500" },
  ];

  return (
    <div>
      <div className="p-8">
        <Header />
      </div>
      <div className="space-y-6">
        {/* Formulario para añadir tareas */}
        <form
          onSubmit={handleAddTask}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center"
        >
          <input
            type="text"
            placeholder="Título de la nueva tarea..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full"
          />
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="DevOps">DevOps</option>
            <option value="Backend">Backend</option>
            <option value="Database">Database</option>
            <option value="Monitor">Monitor</option>
            <option value="General">General</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 w-full md:w-auto justify-center"
          >
            <Plus size={16} />
            <span>Añadir</span>
          </button>
        </form>

        {/* Columnas del Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 min-h-[400px]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${col.color}`}
                    ></span>
                    <h3 className="font-semibold text-white text-sm">
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-mono">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-3 group hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                          {task.tag}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase ${
                            task.priority === "high"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : task.priority === "medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-slate-200">
                        {task.title}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                        <div className="flex items-center gap-1">
                          {col.id !== "todo" && (
                            <button
                              onClick={() =>
                                moveTask(
                                  task.id,
                                  col.id === "done" ? "in_progress" : "todo",
                                )
                              }
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
                            >
                              &larr; Mover
                            </button>
                          )}
                          {col.id !== "done" && (
                            <button
                              onClick={() =>
                                moveTask(
                                  task.id,
                                  col.id === "todo" ? "in_progress" : "done",
                                )
                              }
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] ml-auto"
                            >
                              Mover &rarr;
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition ml-auto"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-xl">
                      Sin tareas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Kanban;
