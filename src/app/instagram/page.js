import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { MessageSquare, Instagram, Clock, User, ChevronRight } from "lucide-react";

async function getConversations() {
  try {
    const res = await query(`
      SELECT 
        session_id, 
        MAX(created_at) as last_message,
        COUNT(*) as total_messages
      FROM tiiko_chat_memory
      GROUP BY session_id
      ORDER BY last_message DESC
      LIMIT 20
    `);
    return res.rows;
  } catch (e) {
    console.error("Error fetching conversations:", e);
    return [];
  }
}

export default async function InstagramMonitoringPage() {
  const conversations = await getConversations();

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', padding: '0.5rem', borderRadius: '12px', display: 'flex' }}>
            <Instagram color="white" size={24} />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Monitoreo Instagram</h1>
        </div>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>
          Supervisa las conversaciones en tiempo real entre tus clientes y el Agente Virtual de Practiiko.
        </p>
      </header>

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {conversations.length === 0 ? (
          <div className="card glass" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <MessageSquare size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No hay conversaciones activas</h3>
            <p style={{ color: 'var(--muted-foreground)' }}>Las charlas de Instagram aparecerán aquí una vez que el Webhook esté configurado.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.session_id} href={`/instagram/${conv.session_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card glass conversation-card" style={{ 
                padding: '1.5rem', 
                transition: 'all 0.2s', 
                cursor: 'pointer',
                display: 'block' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700 }}>Cliente: {conv.session_id.substring(0, 10)}...</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {new Date(conv.last_message).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(4, 119, 191, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {conv.total_messages} msg
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                  Ver conversación completa
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
