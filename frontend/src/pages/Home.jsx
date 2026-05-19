import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import api from "../services/api";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    api
      .get("/")
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("disconnected"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl w-full">
        {/* Title row */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Wallet className="w-10 h-10 text-emerald-400" />
          <h1 className="text-5xl font-bold tracking-tight text-white">
            SmartBudget
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg mb-8">
          Tu presupuesto personal, potenciado con IA
        </p>

        {/* Backend status badge */}
        <div className="flex justify-center mb-10">
          {backendStatus === "connected" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Backend conectado ✓
            </span>
          )}
          {backendStatus === "disconnected" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-900/50 text-red-400 border border-red-700">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Backend desconectado ✗
            </span>
          )}
          {backendStatus === null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
              Verificando conexión…
            </span>
          )}
        </div>

        {/* CTA button */}
        <button
          type="button"
          className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-lg transition-colors duration-200 shadow-lg shadow-emerald-900/30"
        >
          Comenzar
        </button>
      </div>
    </div>
  );
}
