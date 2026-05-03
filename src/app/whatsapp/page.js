import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { MessageSquare, Phone, Clock, User, ChevronRight } from "lucide-react";

async function getConversations() {
  try {
    const res = await query(`
      SELECT 
        session_id, 
        MAX(created_at) as last_message,
        COUNT(*) as total_messages
      FROM tiiko_whatsapp_memory
      GROUP BY session_id
      ORDER BY last_message DESC
      LIMIT 20
    `);
    return res.rows;
  } catch (e) {
    console.error("Error fetching whatsapp conversations:", e);
    return [];
  }
}

export default async function WhatsAppMonitoringPage() {
  const conversations = await getConversations();

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ background: '#25D366', padding: '0.5rem', borderRadius: '12px', display: 'flex' }}>
            <Phone color="white" size={24} />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Monitoreo WhatsApp</h1>
        </div>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>
          Supervisa las conversaciones del canal de WhatsApp.
        </p>
      </header>

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {conversations.length === 0 ? (
          <div className="card glass" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <MessageSquare size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No hay conversaciones de WhatsApp</h3>
            <p style={{ color: 'var(--muted-foreground)' }}>Las charlas de WhatsApp aparecerán aquí una vez que se reciban mensajes.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.session_id} href={`/whatsapp/${conv.session_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card glass conversation-card" style={{ 
                padding: '1.5rem', 
                transition: 'all 0.2s', 
                cursor: 'pointer',
                display: 'block' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Phone size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700 }}>Tel: {conv.session_id}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {new Date(conv.last_message).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', color: '#128C7E', fontSize: '0.875rem', fontWeight: 600 }}>
                  Ver historial
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
