import { query } from "@/lib/db";
import { Package, TrendingUp, Users, AlertCircle } from "lucide-react";

async function getStats() {
  try {
    // In a real app, these would be real queries
    // const productsCount = await query("SELECT COUNT(*) FROM products");
    // const usersCount = await query("SELECT COUNT(*) FROM users");
    
    return {
      products: 12, // Placeholder
      users: 3,
      views: 1240,
      status: 'Online'
    };
  } catch (e) {
    return { products: 0, users: 0, views: 0, status: 'Error' };
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
            <span className="badge badge-success">+2 esta semana</span>
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Productos Totales</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.products}</p>
        </div>

        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(242, 135, 5, 0.1)', borderRadius: '0.5rem', color: 'var(--secondary)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Visitas SEO</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.views.toLocaleString()}</p>
        </div>

        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem', color: '#4ade80' }}>
              <AlertCircle size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
              ACTIVO
            </div>
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Estado del Sistema</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.status}</p>
        </div>
      </div>

      <div className="card glass" style={{ marginTop: '2rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Acciones Rápidas</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary">Añadir Producto</button>
          <button className="btn-primary" style={{ background: 'var(--secondary)', color: 'var(--foreground)', boxShadow: 'none' }}>Ver Reportes</button>
        </div>
      </div>
    </div>
  );
}
