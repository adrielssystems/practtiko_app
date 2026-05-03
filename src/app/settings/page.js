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
  AlertCircle,
  Eye,
  Copy,
  Zap,
  Globe,
  Database,
  Code
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
  const [selectedLog, setSelectedLog] = useState(null);
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
        addToast("¡Cerebro de IA actualizado!", "success");
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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Header Premium */}
      <header style={{ marginBottom: '3rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, #035a91 100%)', 
            padding: '1rem', 
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(4, 119, 191, 0.3)',
            color: 'white'
          }}>
            <Settings size={40} className={isLoading ? "animate-spin" : ""} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1a1a1a', margin: 0, letterSpacing: '-0.03em' }}>
              Configuración del Sistema
            </h1>
            <p style={{ color: '#666', fontSize: '1.1rem', marginTop: '0.25rem' }}>Gestiona la inteligencia artificial y supervisa la infraestructura de red.</p>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        
        {/* Sidebar Navigation */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={() => setActiveTab("ai")}
            className={`settings-nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
          >
            <Brain size={20} />
            <span>Inteligencia Artificial</span>
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`settings-nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <Terminal size={20} />
            <span>Consola de Webhooks</span>
          </button>
          <button 
            onClick={() => setActiveTab("system")}
            className={`settings-nav-btn ${activeTab === 'system' ? 'active' : ''}`}
          >
            <Activity size={20} />
            <span>Estado de Red</span>
          </button>

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '20px', border: '1px dashed #ddd' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Resumen de IA</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#128C7E', fontWeight: 700, fontSize: '0.9rem' }}>
              <Zap size={14} /> Activo: DeepSeek-V4 Flash
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              <Globe size={14} /> Latencia: ~1.2s
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main>
          {activeTab === 'ai' && (
            <div className="card glass animate-in" style={{ padding: '2.5rem', borderRadius: '30px', border: '1px solid #f0f0f0', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Prompt Maestro (Cerebro)</h3>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', color: '#666' }}>
                    Define la personalidad, restricciones y flujo de cierre comercial del Agente Virtual.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        await fetch("/api/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ key: "ai_prompt", value: "" })
                        });
                        setPrompt("");
                        addToast("¡Cerebro restablecido al código base! 💎", "success");
                      } catch(e) {
                        addToast("Error al restablecer", "error");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="btn"
                    style={{ 
                      padding: '0.85rem 1.5rem', 
                      borderRadius: '15px', 
                      background: 'rgba(255, 71, 87, 0.1)', 
                      color: '#ff4757', 
                      border: '1px solid rgba(255, 71, 87, 0.2)',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={18} /> Restablecer Fábrica
                  </button>
                  <button 
                    onClick={savePrompt}
                    disabled={isLoading}
                    className="btn-primary"
                    style={{ 
                      padding: '0.85rem 2.5rem', 
                      borderRadius: '15px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      boxShadow: '0 10px 25px rgba(4, 119, 191, 0.2)'
                    }}
                  >
                    {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                    {isLoading ? 'Actualizando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    height: '550px',
                    padding: '2rem',
                    borderRadius: '20px',
                    border: '1px solid #e0e0e0',
                    fontSize: '1rem',
                    fontFamily: '"Fira Code", monospace',
                    lineHeight: '1.6',
                    background: '#1a1a1a',
                    color: '#d1d1d1',
                    outline: 'none',
                    resize: 'vertical',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
                  }}
                />
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ padding: '4px 10px', background: '#333', borderRadius: '6px', fontSize: '0.7rem', color: '#aaa', fontWeight: 700 }}>READ-WRITE</span>
                </div>
              </div>

              {/* Tag system for help */}
              <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ padding: '1.25rem', background: '#e7f1f9', borderRadius: '18px', border: '1px solid #cde4f5' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#0477BF', fontWeight: 800 }}>VARIABLES DINÁMICAS</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <code style={{ background: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: '#1a1a1a', border: '1px solid #b7d7f0' }}>{`{now}`}</code>
                    <code style={{ background: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: '#1a1a1a', border: '1px solid #b7d7f0' }}>{`{customer_name}`}</code>
                    <code style={{ background: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: '#1a1a1a', border: '1px solid #b7d7f0' }}>{`{channel}`}</code>
                  </div>
                </div>
                <div style={{ padding: '1.25rem', background: '#f8f9fa', borderRadius: '18px', border: '1px solid #eee' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#666', fontWeight: 800 }}>CONSEJO PRO</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                    Añade <b>"Responde siempre en español de Venezuela"</b> para un tono más local y cercano a tus clientes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="card glass animate-in" style={{ padding: '2.5rem', borderRadius: '30px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Historial de Eventos</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', color: '#666' }}>Monitoreo en tiempo real de las llamadas entrantes de Meta y Evolution.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', background: '#f0f0f0', padding: '4px', borderRadius: '12px' }}>
                    {['all', 'instagram', 'whatsapp'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: filter === f ? 'white' : 'transparent',
                          color: filter === f ? '#1a1a1a' : '#888',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: filter === f ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                          textTransform: 'capitalize'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={fetchLogs}
                    style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #eee', background: 'white', cursor: 'pointer' }}
                  >
                    <RefreshCw size={20} className={logsLoading ? 'animate-spin text-primary' : ''} />
                  </button>
                </div>
              </div>

              <div style={{ overflow: 'hidden', borderRadius: '20px', border: '1px solid #f0f0f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}>
                      <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#888', fontWeight: 800 }}>ESTAMPA</th>
                      <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#888', fontWeight: 800 }}>CANAL</th>
                      <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#888', fontWeight: 800 }}>TIPO</th>
                      <th style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#888', fontWeight: 800 }}>ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s' }} className="hover:bg-slate-50">
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {new Date(log.created_at).toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' })}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{new Date(log.created_at).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ 
                            background: log.event_type === 'whatsapp' ? '#e7f9ed' : '#e7f1f9',
                            color: log.event_type === 'whatsapp' ? '#128C7E' : '#0477BF',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase'
                          }}>
                            {log.event_type}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontSize: '0.85rem', color: '#555', fontFamily: 'monospace' }}>
                            {log.payload?.event || log.payload?.type || 'Incoming Webhook'}
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <button 
                            onClick={() => setSelectedLog(log)}
                            style={{ 
                              background: '#f0f0f0', 
                              border: 'none', 
                              padding: '8px 15px', 
                              borderRadius: '10px', 
                              fontSize: '0.75rem', 
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Eye size={14} /> Inspeccionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card glass animate-in" style={{ padding: '2.5rem', borderRadius: '30px', background: 'white' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Estado de Conexiones</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <ConnectionCard 
                  title="Evolution API" 
                  status="Online" 
                  url="https://lume1-evolution-api.91xjh2.easypanel.host"
                  icon={<Database size={24} />}
                />
                <ConnectionCard 
                  title="Meta Webhook" 
                  status="Active" 
                  url="Instagram Graph API v21.0"
                  icon={<Globe size={24} />}
                />
                <ConnectionCard 
                  title="Base de Datos" 
                  status="Connected" 
                  url="PostgreSQL (Neon)"
                  icon={<Database size={24} />}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Inspección de Log */}
      {selectedLog && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(5px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div className="animate-in" style={{ 
            background: 'white', 
            width: '100%', 
            maxWidth: '800px', 
            maxHeight: '85vh', 
            borderRadius: '30px', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <header style={{ padding: '1.5rem 2rem', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Code size={20} className="text-primary" />
                <h4 style={{ margin: 0, fontWeight: 800 }}>Inspección de Payload</h4>
              </div>
              <button onClick={() => setSelectedLog(null)} className="btn-close">
                Cerrar Panel
              </button>
            </header>
            <div style={{ flex: 1, overflow: 'auto', padding: '2rem', background: '#1a1a1a' }}>
              <pre style={{ 
                margin: 0, 
                color: '#A9FFCB', 
                fontSize: '0.9rem', 
                fontFamily: '"Fira Code", monospace',
                lineHeight: '1.5'
              }}>
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>
            <footer style={{ padding: '1.25rem 2rem', background: '#f8f9fa', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
                  addToast("Copiado al portapapeles", "success");
                }}
                className="btn secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Copy size={16} /> Copiar JSON
              </button>
            </footer>
          </div>
        </div>
      )}

      <style jsx>{`
        .settings-nav-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-radius: 15px;
          border: 1px solid transparent;
          background: transparent;
          color: #666;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .settings-nav-btn:hover {
          background: #f0f0f0;
          color: #1a1a1a;
        }
        .settings-nav-btn.active {
          background: white;
          color: var(--primary);
          border-color: #eee;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .animate-in {
          animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ConnectionCard({ title, status, url, icon }) {
  return (
    <div style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f0f0f0', background: '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: 'var(--primary)' }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#e7f9ed', color: '#128C7E', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
          {status}
        </span>
      </div>
      <h4 style={{ margin: '0 0 0.25rem', fontWeight: 800 }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', wordBreak: 'break-all' }}>{url}</p>
    </div>
  );
}
