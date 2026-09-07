// frontend/app/forgot-password/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Server, ArrowRight, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        setStatusMessage('No se pudo procesar la solicitud de recuperación.');
      }
    } catch (error) {
      setStatusMessage('Error de conexión con el backend SMTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-blue-500 selection:text-white">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 mb-8 flex items-center space-x-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Server className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          DockStream
        </span>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl shadow-2xl shadow-black/50">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold tracking-tight">Recuperar Contraseña</h2>
          <p className="text-xs text-gray-400 mt-1">Gestión de restablecimiento mediante SMTP</p>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl text-xs bg-red-950/40 border border-red-800/60 text-red-300">
            <span>{statusMessage}</span>
          </div>
        )}

        {sent ? (
          <div className="space-y-6 text-center">
            <p className="text-sm text-green-400 bg-green-950/40 border border-green-800/60 p-4 rounded-xl">
              Si el correo existe en el sistema, se ha enviado un enlace SMTP con las instrucciones para restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-sm transition text-center"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-xs text-gray-400 mb-2">
              Introduce tu correo electrónico y te enviaremos un enlace de recuperación cifrado.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@dominio.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-950/80 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-semibold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <span>{loading ? 'Enviando...' : 'Enviar Correo SMTP'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-xs text-gray-400 hover:text-white transition">
                ← Volver al login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}