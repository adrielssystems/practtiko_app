"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Terminal, 
  Brain, 
  Save, 
  RefreshCw, 
  Clock, 
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("ai");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const { addToast } = useToast();

  // Cargar prompt inicial
  useEffect(() => {
    fetch("/api/settings?key=ai_prompt")
      .then(res => res.json())
      .then(data => {
        if (data.value) setPrompt(data.value);
      });
  }, []);

  // Cargar logs cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, filter]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/logs?filter=${filter}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      addToast("Error al cargar logs", "error");
    } finally {
      setLogsLoading(false);
    }
  };

  const savePrompt = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ai_prompt", value: prompt })
      });
      if (res.ok) {
        addToast("Prompt actualizado correctamente", "success");
      } else {
        addToast("Error al guardar el prompt", "error");
      }
    } catch (e) {
      addToast("Error de conexión", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={32} className="text-primary" /> Ajustes del Sistema
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Configura el comportamiento de la IA y monitorea la infraestructura.</p>
      </header>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab("ai")}
          style={{
            background: activeTab === 'ai' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'ai' ? 'white' : '#666',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Brain size={18} /> Configuración IA
        </button>
        <button 
          onClick={() => setActiveTab("logs")}
          style={{
            background: activeTab === 'logs' ? '#1a1a1a' : 'transparent',
            color: activeTab === 'logs' ? 'white' : '#666',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Terminal size={18} /> Consola de Logs
        </button>
      </div>

      {/* Content Area */}
      <div className="card glass" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #f0f0f0' }}>
        
        {activeTab === 'ai' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Prompt Maestro de Ventas</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#888' }}>
                  Este es el "cerebro" que controla cómo responde la IA en Instagram y WhatsApp.
                </p>
              </div>
              <button 
                onClick={savePrompt}
                disabled={isLoading}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
              >
                {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pega aquí el prompt maestro..."
              style={{
                width: '100%',
                height: '500px',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                background: '#fafafa',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '10px', border: '1px dashed #ddd' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 800, color: '#555' }}>TIPS DE CONFIGURACIÓN:</h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#666', lineHeight: '1.5' }}>
                <li>Usa <b>{`{now}`}</b> para que la IA sepa la fecha actual.</li>
                <li>Usa <b>{`{customer_name}`}</b> para personalizar el saludo.</li>
                <li>Define reglas de precio claras para evitar confusiones.</li>
                <li>Mantén las respuestas concisas (máximo 3 líneas) para WhatsApp.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Actividad del Webhook</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                >
                  <option value="all">Todos los canales</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                <button 
                  onClick={fetchLogs}
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                >
                  <RefreshCw size={18} className={logsLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #eee' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '1rem' }}>Fecha/Hora</th>
                    <th style={{ padding: '1rem' }}>Canal</th>
                    <th style={{ padding: '1rem' }}>Estado</th>
                    <th style={{ padding: '1rem' }}>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && !logsLoading && (
                    <tr>
                      <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>No hay registros recientes.</td>
                    </tr>
                  )}
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{new Date(log.created_at).toLocaleTimeString()}</div>
                        <div style={{ fontSize: '0.7rem', color: '#999' }}>{new Date(log.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          background: log.event_type === 'whatsapp' ? '#e7f9ed' : '#e7f1f9',
                          color: log.event_type === 'whatsapp' ? '#128C7E' : '#0477BF',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          textTransform: 'uppercase'
                        }}>
                          {log.event_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <CheckCircle2 size={16} className="text-green-500" />
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          maxWidth: '400px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontSize: '0.75rem',
                          color: '#666',
                          fontFamily: 'monospace'
                        }}>
                          {JSON.stringify(log.payload)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
