import { query } from "@/lib/db";
import { Terminal, Clock, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WebhookLogsPage() {
  const res = await query("SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 50");
  const logs = res.rows;

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/instagram" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', textDecoration: 'none', marginBottom: '1rem' }}>
          <ArrowLeft size={16} />
          Volver al monitoreo
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Terminal className="text-primary" /> Consola de Webhooks
        </h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Eventos en tiempo real recibidos desde Meta (Instagram).</p>
      </header>

      <div className="card glass" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Fecha/Hora</th>
                <th style={{ padding: '1rem' }}>Evento</th>
                <th style={{ padding: '1rem' }}>Payload (JSON)</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    No hay eventos registrados todavía. Esperando actividad de Meta...
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                  <td style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>{log.id}</td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} className="text-muted-foreground" />
                      {new Date(log.created_at).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      background: log.event_type === 'instagram' ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(0,0,0,0.05)',
                      color: log.event_type === 'instagram' ? 'var(--primary)' : 'inherit',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase'
                    }}>
                      {log.event_type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <pre style={{ 
                      margin: 0, 
                      padding: '0.5rem', 
                      background: '#1a1a1a', 
                      color: '#00ff00', 
                      borderRadius: '4px', 
                      maxWidth: '600px', 
                      maxHeight: '200px', 
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace'
                    }}>
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
