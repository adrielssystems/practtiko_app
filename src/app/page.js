import { query } from "@/lib/db";
import { Package, TrendingUp, Users, AlertCircle } from "lucide-react";
export const dynamic = "force-dynamic";


async function getStats() {
  try {
    const productsRes = await query("SELECT COUNT(*) FROM products");
    const messagesRes = await query("SELECT COUNT(*) FROM instagram_messages");
    const activeChatsRes = await query("SELECT COUNT(DISTINCT session_id) FROM instagram_messages");
    
    // Verificar si el webhook ha estado activo recientemente (últimas 24h)
    const lastWebhookRes = await query("SELECT created_at FROM webhook_logs ORDER BY created_at DESC LIMIT 1");
    const lastSignal = lastWebhookRes.rows[0]?.created_at;
    const isOnline = lastSignal ? (new Date() - new Date(lastSignal)) < (24 * 60 * 60 * 1000) : false;

    return {
      products: parseInt(productsRes.rows[0]?.count || 0),
      messages: parseInt(messagesRes.rows[0]?.count || 0),
      activeChats: parseInt(activeChatsRes.rows[0]?.count || 0),
      status: isOnline ? 'Online' : 'Inactivo'
    };
  } catch (e) {
    console.error("Error fetching dashboard stats:", e);
    return { products: 0, messages: 0, activeChats: 0, status: 'Error' };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
          Bienvenido al panel de control de Practiiko.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(4, 119, 191, 0.1)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
              <Package size={20} />
            </div>
            <span className="badge badge-success">Inventario</span>
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Productos Totales</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.products}</p>
        </div>

        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(242, 135, 5, 0.1)', borderRadius: '0.5rem', color: 'var(--secondary)' }}>
              <TrendingUp size={20} />
            </div>
            <span className="badge" style={{ background: 'rgba(242, 135, 5, 0.1)', color: 'var(--secondary)' }}>Instagram</span>
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Mensajes Procesados</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.messages.toLocaleString()}</p>
        </div>

        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: stats.status === 'Online' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', color: stats.status === 'Online' ? '#4ade80' : '#f87171' }}>
              <AlertCircle size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: stats.status === 'Online' ? '#22c55e' : '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: stats.status === 'Online' ? '#22c55e' : '#ef4444' }}></span>
              {stats.status === 'Online' ? 'ACTIVO' : 'ALERTA'}
            </div>
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Estado del Canal</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.status}</p>
        </div>
      </div>

      <div className="card glass" style={{ marginTop: '2rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Acciones Rápidas</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/products" className="btn-primary" style={{ textDecoration: 'none' }}>Añadir Producto</a>
          <a href="/instagram" className="btn-primary" style={{ background: 'var(--secondary)', color: 'var(--foreground)', boxShadow: 'none', textDecoration: 'none' }}>Ver Mensajes</a>
        </div>
      </div>
    </div>
  );
}
