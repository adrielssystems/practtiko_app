export default function Home() {
  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Bienvenido al Panel de Control</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Desde aquí puedes gestionar el contenido y SEO de tu sitio web.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', background: '#18181b', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Páginas Totales</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>12</p>
        </div>
        <div style={{ padding: '1.5rem', background: '#18181b', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Visitas SEO</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>1,240</p>
        </div>
        <div style={{ padding: '1.5rem', background: '#18181b', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Estado del Sitio</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            Online
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <button className="btn-primary">Nueva Publicación</button>
      </div>
    </div>
  );
}
