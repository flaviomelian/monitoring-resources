"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import {
  FolderOpen,
  Upload,
  Download,
  FileText,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Music,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import Header from "../component/Header";

interface FileItem {
  id: number;
  name: string;
  url: string;
  size: number;
}

export default function FileManagementPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBase = "http://localhost:8081/api/files";

  const fetchFiles = async () => {
    try {
      const res = await fetch(apiBase);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (e) {
      console.error("No se pudieron cargar los ficheros del backend", e);
      setStatusMessage({
        type: "error",
        text: "No se pudo conectar con el backend en http://localhost:8081",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await fetch(apiBase);
        if (res.ok && isMounted) {
          const data = await res.json();
          setFiles(data);
        }
      } catch (e) {
        if (isMounted) {
          console.error("No se pudieron cargar los ficheros del backend", e);
          setStatusMessage({
            type: "error",
            text: "No se pudo conectar con el backend en http://localhost:8081",
          });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setLoading(true);
    setStatusMessage(null);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const formData = new FormData();
      formData.append("file", uploadedFiles[i]);

      try {
        const res = await fetch(`${apiBase}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(
            res.status === 413
              ? "El fichero es demasiado grande (Error 413)"
              : "Error al subir el fichero"
          );
        }
      } catch (error: any) {
        setStatusMessage({
          type: "error",
          text:
            error.message ||
            "Error de conexión con el backend al subir el fichero.",
        });
        setLoading(false);
        return;
      }
    }

    // Limpiar el input para permitir volver a subir el mismo archivo si se desea
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setStatusMessage({
      type: "success",
      text: "Fichero(s) subido(s) y guardado(s) en el backend con éxito.",
    });
    setLoading(false);
    fetchFiles();
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Error al descargar el archivo");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al descargar el fichero:", error);
      setStatusMessage({
        type: "error",
        text: "No se pudo completar la descarga del fichero.",
      });
    }
  };

  const isAudioFile = (fileName: string) => {
    const extensions = [".mp3", ".wav", ".ogg", ".m4a", ".flac"];
    return extensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const isImageFile = (fileName: string) => {
    const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"];
    return extensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const isVideoFile = (fileName: string) => {
    const extensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    return extensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-6 flex flex-col space-y-6">
      <Header />
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl w-full flex-1 flex flex-col space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Gestor Universal de Ficheros y Multimedia
              </h3>
              <p className="text-xs text-slate-400">
                Soporte para imágenes, vídeos, audio y documentos con almacenamiento persistente
              </p>
            </div>
          </div>
          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{loading ? "Subiendo..." : "Subir Fichero"}</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs border flex items-center space-x-2 ${
              statusMessage.type === "success"
                ? "bg-green-950/40 border-green-800/60 text-green-300"
                : "bg-red-950/40 border-red-800/60 text-red-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="border-2 border-dashed border-slate-800 bg-slate-950/40 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-2">
          <FolderOpen className="w-6 h-6 text-slate-500" />
          <p className="text-xs text-slate-400">
            Puedes subir cualquier clase de archivo. Las imágenes y vídeos se pueden visualizar directamente.
          </p>
        </div>

        <div className="flex-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="p-3 font-semibold">Nombre del Fichero</th>
                <th className="p-3 font-semibold">Tamaño</th>
                <th className="p-3 font-semibold">Reproductor / Vista Previa</th>
                <th className="p-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No hay ficheros almacenados en el servidor.
                  </td>
                </tr>
              ) : (
                files.map((file, index) => (
                  <tr key={index} className="hover:bg-slate-900/40 transition">
                    <td className="p-3 flex items-center space-x-2 font-medium text-slate-200">
                      {isAudioFile(file.name) ? (
                        <Music className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : isImageFile(file.name) ? (
                        <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isVideoFile(file.name) ? (
                        <Video className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                      <span className="truncate max-w-xs">{file.name}</span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="p-3">
                      {isAudioFile(file.name) ? (
                        <audio
                          controls
                          className="h-8 w-full max-w-xs accent-blue-500"
                        >
                          <source src={file.url} />
                          Tu navegador no soporta el elemento de audio.
                        </audio>
                      ) : isImageFile(file.name) ? (
                        <div className="flex items-center space-x-3">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-700 hover:scale-105 transition shadow-sm"
                            />
                          </a>
                          <span className="text-slate-400 italic text-[11px]">
                            Imagen (Clic para ampliar)
                          </span>
                        </div>
                      ) : isVideoFile(file.name) ? (
                        <video
                          controls
                          className="h-16 w-full max-w-[200px] rounded-lg border border-slate-700"
                        >
                          <source src={file.url} />
                          Tu navegador no soporta vídeo.
                        </video>
                      ) : (
                        <span className="text-slate-500 italic">
                          Documento / Archivo genérico
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDownload(file.url, file.name)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 border border-slate-800 transition cursor-pointer"
                        title="Descargar fichero"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}