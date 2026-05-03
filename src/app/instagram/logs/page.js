import { query } from "@/lib/db";
import { Terminal, Clock, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WebhookLogsPage({ searchParams }) {
  const filter = searchParams?.filter || 'all';
  const search = searchParams?.search || '';

  let sql = "SELECT * FROM webhook_logs";
  let params = [];

  if (filter !== 'all' || search !== '') {
    sql += " WHERE";
    if (filter !== 'all') {
      sql += " event_type = $1";
      params.push(filter);
    }
    if (search !== '') {
      if (filter !== 'all') sql += " AND";
      sql += ` payload::text ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
  }

  sql += " ORDER BY created_at DESC LIMIT 50";

  const res = await query(sql, params);
  const logs = res.rows;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/instagram" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', textDecoration: 'none', marginBottom: '1rem' }}>
          <ArrowLeft size={16} />
          Volver al monitoreo
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Terminal className="text-primary" /> Consola de Webhooks
            </h1>
            <p style={{ color: 'var(--muted-foreground)' }}>Eventos en tiempo real procesados por el sistema.</p>
          </div>

          <form style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'white', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>FILTRAR POR CANAL</label>
              <select 
                name="filter" 
                defaultValue={filter}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem', outline: 'none' }}
              >
                <option value="all">Todos los canales</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="test">Simulador</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>BUSCAR EN PAYLOAD</label>
              <input 
                name="search" 
                placeholder="ID, mensaje, etc..." 
                defaultValue={search}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem', outline: 'none', width: '200px' }}
              />
            </div>

            <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', marginTop: '1rem' }}>Filtrar</button>
            <Link href="/instagram/logs" style={{ padding: '0.6rem', marginTop: '1rem', color: '#666' }}>Limpiar</Link>
          </form>
        </div>
      </header>

      <div className="card glass" style={{ overflow: 'hidden', border: '1px solid #f0f0f0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid #f0f0f0' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Fecha/Hora</th>
                <th style={{ padding: '1rem' }}>Canal</th>
                <th style={{ padding: '1rem' }}>Payload (JSON)</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '5rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.1 }} />
                    <p>No se encontraron eventos con los filtros actuales.</p>
                  </td>
                </tr>
              )}
              {logs.map((log) => {
                const isWA = log.event_type === 'whatsapp';
                const isIG = log.event_type === 'instagram';
                
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f9f9f9', verticalAlign: 'top' }}>
                    <td style={{ padding: '1rem', color: '#ccc', fontWeight: 600 }}>{log.id}</td>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#444' }}>
                        <Clock size={14} style={{ opacity: 0.5 }} />
                        {new Date(log.created_at).toLocaleString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.2rem', marginLeft: '1.4rem' }}>
                        {new Date(log.created_at).toLocaleDateString('es-VE')}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        background: isWA ? 'rgba(37, 211, 102, 0.1)' : isIG ? 'rgba(4, 119, 191, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: isWA ? '#128C7E' : isIG ? 'var(--primary)' : '#666',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        border: `1px solid ${isWA ? 'rgba(37, 211, 102, 0.2)' : isIG ? 'rgba(4, 119, 191, 0.2)' : '#eee'}`
                      }}>
                        {log.event_type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <pre style={{ 
                        margin: 0, 
                        padding: '0.75rem', 
                        background: '#fdfdfd', 
                        color: '#333', 
                        borderRadius: '10px', 
                        border: '1px solid #f0f0f0',
                        maxWidth: '800px', 
                        maxHeight: '200px', 
                        overflow: 'auto',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace'
                      }}>
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
