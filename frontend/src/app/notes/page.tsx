'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save, Tag } from 'lucide-react';
import Header from '../component/Header';

interface Note {
  id: string;
  projectId: string;
  title: string;
  content: string;
  date: string;
}

export default function ProjectNotes({ projectId = "general" }: { projectId?: string }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window === "undefined") return [];
    const savedNotes = localStorage.getItem(`dockstream_notes_${projectId}`);
    if (savedNotes) {
      try {
        return JSON.parse(savedNotes);
      } catch (e) {
        console.error("Error al cargar notas:", e);
      }
    }
    return [];
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem(`dockstream_notes_${projectId}`);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Error al cargar notas:", e);
      }
    } else {
      setNotes([]);
    }
  }, [projectId]);

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(`dockstream_notes_${projectId}`, JSON.stringify(updatedNotes));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      projectId,
      title,
      content,
      date: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    saveNotes([newNote, ...notes]);
    setTitle("");
    setContent("");
    setIsAdding(false);
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notes.filter((note) => note.id !== id);
    saveNotes(filtered);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-6 flex flex-col space-y-6">
        <Header/>
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl w-full flex-1 flex flex-col space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Notas del Proyecto</h3>
              <p className="text-xs text-slate-400">Bitácora técnica y apuntes rápidos del clúster</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? "Cancelar" : "Nueva Nota"}</span>
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddNote} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Título de la nota</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Configuración de réplicas en nodo 2"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contenido / Comandos</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe detalles técnicos, credenciales temporales o recordatorios..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition text-white resize-none"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Nota</span>
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
          {notes.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
              <FileText className="w-8 h-8 mb-2 opacity-40" />
              <span>No hay notas registradas para este proyecto todavía.</span>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-slate-700 transition h-fit"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-semibold text-slate-200">{note.title}</h4>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                      title="Eliminar nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-pre-wrap font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-900">
                    {note.content}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Tag className="w-3 h-3" />
                    <span>ID: {note.projectId}</span>
                  </span>
                  <span>{note.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}