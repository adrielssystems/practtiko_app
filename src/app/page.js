import { query } from "@/lib/db";
import { 
  Package, 
  TrendingUp, 
  MessageCircle, 
  MessageSquare, 
  Activity, 
  Clock, 
  ChevronRight, 
  Plus,
  Zap,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import AutoRefresh from "@/components/Common/AutoRefresh";

export const dynamic = "force-dynamic";

async function getDetailedStats() {
  try {
    // Totales
    const productsRes = await query("SELECT COUNT(*) FROM products");
    const igMessagesRes = await query("SELECT COUNT(*) FROM instagram_messages");
    const waMessagesRes = await query("SELECT COUNT(*) FROM whatsapp_messages");
    const customersRes = await query("SELECT COUNT(*) FROM instagram_customers");
    const waCustomersRes = await query("SELECT COUNT(*) FROM whatsapp_customers");
    
    // Actividad reciente Instagram
    const recentIg = await query(`
      SELECT 
        session_id, 
        message::json->>'content' as content, 
        to_char(created_at AT TIME ZONE 'America/Caracas', 'HH12:MI AM') as time
      FROM instagram_messages 
      WHERE message::json->>'role' = 'user'
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    // Actividad reciente WhatsApp
    const recentWa = await query(`
      SELECT 
        session_id, 
        message::json->>'content' as content, 
        to_char(created_at AT TIME ZONE 'America/Caracas', 'HH12:MI AM') as time
      FROM whatsapp_messages 
      WHERE message::json->>'role' = 'user'
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    // Status del Webhook (últimas 12h)
    const lastWebhookRes = await query("SELECT created_at FROM webhook_logs ORDER BY created_at DESC LIMIT 1");
    const lastSignal = lastWebhookRes.rows[0]?.created_at;
    const isOnline = lastSignal ? (new Date() - new Date(lastSignal)) < (12 * 60 * 60 * 1000) : false;

    return {
      products: parseInt(productsRes.rows[0]?.count || 0),
      igMessages: parseInt(igMessagesRes.rows[0]?.count || 0),
      waMessages: parseInt(waMessagesRes.rows[0]?.count || 0),
      totalCustomers: parseInt(customersRes.rows[0]?.count || 0) + parseInt(waCustomersRes.rows[0]?.count || 0),
      status: isOnline ? 'ACTIVO' : 'STANDBY',
      recentIg: recentIg.rows,
      recentWa: recentWa.rows
    };
  } catch (e) {
    console.error("Dashboard error:", e);
    return { products: 0, igMessages: 0, waMessages: 0, totalCustomers: 0, status: 'Error', recentIg: [], recentWa: [] };
  }
}

export default async function OverviewPage() {
  const data = await getDetailedStats();

  return (
    <div style={{ padding: '0 1rem' }}>
      <AutoRefresh interval={10000} />
      
      {/* HEADER SECTION */}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
            <Zap size={18} fill="currentColor" />
            <span style={{ fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.75rem', textTransform: 'uppercase' }}>Sistema Operativo</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: '#0f172a' }}>Overview</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.25rem' }}>Gestión inteligente de ventas y atención al cliente.</p>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '0.75rem 1.25rem', 
          borderRadius: '16px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Estado Global</p>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: data.status === 'ACTIVO' ? '#10b981' : '#f59e0b' }}>
              {data.status}
            </p>
          </div>
          <div style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            background: data.status === 'ACTIVO' ? '#10b981' : '#f59e0b',
            boxShadow: `0 0 12px ${data.status === 'ACTIVO' ? '#10b981' : '#f59e0b'}`
          }}></div>
        </div>
      </header>

      {/* METRICS GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Metric 1: Products */}
        <div className="card glass-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '14px' }}>
              <Package size={24} />
            </div>
          </div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Catálogo Activo</h3>
          <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{data.products}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Productos listos para la venta</p>
        </div>

        {/* Metric 2: Instagram */}
        <div className="card glass-premium">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem', background: '#fdf2f8', color: '#be185d', borderRadius: '14px' }}>
              <MessageCircle size={24} />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fdf2f8', color: '#be185d', padding: '4px 10px', borderRadius: '20px' }}>IG FEED</span>
          </div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Interacciones IG</h3>
          <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{data.igMessages.toLocaleString()}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Mensajes y comentarios</p>
        </div>

        {/* Metric 3: WhatsApp */}
        <div className="card glass-premium">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem', background: '#f0fdf4', color: '#15803d', borderRadius: '14px' }}>
              <Smartphone size={24} />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: '20px' }}>WHATSAPP</span>
          </div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Chats WhatsApp</h3>
          <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{data.waMessages.toLocaleString()}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Conversaciones cerradas</p>
        </div>

        {/* Metric 4: Customers */}
        <div className="card glass-premium">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem', background: '#fff7ed', color: '#c2410c', borderRadius: '14px' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Audiencia Total</h3>
          <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{data.totalCustomers}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Clientes registrados</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* LEFT COLUMN: ACTIVITY FEED */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--primary)" /> Última Actividad
            </h2>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Sincronizado ahora</div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* WhatsApp Activity */}
            <div className="card glass" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#128C7E', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} /> Recientes WhatsApp
              </h4>
              {data.recentWa.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {data.recentWa.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{msg.session_id}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.content}</p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{msg.time}</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Sin actividad reciente.</p>}
              <Link href="/whatsapp" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#128C7E', fontSize: '0.75rem', fontWeight: 800, marginTop: '1.25rem', textDecoration: 'none' }}>
                GESTIONAR WHATSAPP <ChevronRight size={14} />
              </Link>
            </div>

            {/* Instagram Activity */}
            <div className="card glass" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#be185d', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageCircle size={16} /> Recientes Instagram
              </h4>
              {data.recentIg.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {data.recentIg.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{msg.session_id}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.content}</p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{msg.time}</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Sin actividad reciente.</p>}
              <Link href="/instagram" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#be185d', fontSize: '0.75rem', fontWeight: 800, marginTop: '1.25rem', textDecoration: 'none' }}>
                GESTIONAR INSTAGRAM <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: QUICK ACTIONS & HEALTH */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass-premium" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} color="#38bdf8" /> Acciones Rápidas
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <Link href="/products" style={{ 
                background: '#38bdf8', 
                color: '#0f172a', 
                padding: '0.85rem', 
                borderRadius: '12px', 
                fontWeight: 800, 
                fontSize: '0.85rem', 
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
                transition: 'transform 0.2s'
              }}>
                Añadir Nuevo Producto
              </Link>
              <Link href="/whatsapp" style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                padding: '0.85rem', 
                borderRadius: '12px', 
                fontWeight: 700, 
                fontSize: '0.85rem', 
                textAlign: 'center',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                Ir a WhatsApp
              </Link>
              <Link href="/instagram" style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                padding: '0.85rem', 
                borderRadius: '12px', 
                fontWeight: 700, 
                fontSize: '0.85rem', 
                textAlign: 'center',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                Ir a Instagram
              </Link>
            </div>
          </div>

          <div className="card glass" style={{ border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#10b981" /> Seguridad y Sistema
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'grid', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base de Datos</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>Conectada</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Encriptación</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>Activa (Bcrypt)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Webhooks</span>
                <span style={{ color: data.status === 'ACTIVO' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>Sincronizados</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .glass-premium {
          background: white;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border-radius: 24px;
          padding: 1.75rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .glass-premium:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }
        .card {
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
  );
}
