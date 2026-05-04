"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Terminal, 
  Brain, 
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
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const { addToast } = useToast();

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
            <Settings size={40} />
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
              <Zap size={14} /> Activo: DeepSeek-V4 (Estable)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              <Globe size={14} /> Latencia: ~1.2s
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main>
          {activeTab === 'ai' && (
            <div className="card glass animate-in" style={{ padding: '3rem', borderRadius: '30px', border: '1px solid #f0f0f0', background: 'white', textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'rgba(4, 119, 191, 0.1)', 
                borderRadius: '25px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem',
                color: 'var(--primary)'
              }}>
                <Brain size={40} />
              </div>
              
              <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Cerebro de IA Activo</h3>
              <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                La inteligencia artificial de Practiiko está funcionando con su configuración maestra optimizada desde el núcleo del sistema.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', textAlign: 'left' }}>
                <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '20px', border: '1px solid #eee' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}><Zap size={20} /></div>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 800 }}>MODELO</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>DeepSeek-V4 (Stable)</p>
                </div>
                <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '20px', border: '1px solid #eee' }}>
                  <div style={{ color: '#128C7E', marginBottom: '0.5rem' }}><CheckCircle2 size={20} /></div>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 800 }}>ESTADO</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Optimizado & Operativo</p>
                </div>
                <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '20px', border: '1px solid #eee' }}>
                  <div style={{ color: '#F28705', marginBottom: '0.5rem' }}><Globe size={20} /></div>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 800 }}>COBERTURA</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Instagram & WhatsApp</p>
                </div>
              </div>

              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: '0.85rem', color: '#999' }}>
                  La gestión del prompt se realiza ahora directamente en el repositorio de desarrollo para garantizar la estabilidad del Agente Virtual.
                </p>
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
