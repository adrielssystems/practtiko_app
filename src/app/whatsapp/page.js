import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { MessageSquare, Clock, User, ChevronRight, Settings, Activity, Trash2, Smartphone } from "lucide-react";
import DeleteChatButton from "@/components/Instagram/DeleteChatButton"; // Reutilizamos el botón de borrar
import AutoRefresh from "@/components/Common/AutoRefresh";
import BotPauseToggle from "@/components/Common/BotPauseToggle";

async function getConversations() {
  try {
    const res = await query(`
      SELECT 
        session_id, 
        MAX(created_at) as last_message,
        COUNT(*) as total_messages,
        (SELECT full_name FROM whatsapp_customers WHERE id = session_id LIMIT 1) as push_name,
        (SELECT ai_enabled FROM whatsapp_customers WHERE id = session_id LIMIT 1) as ai_enabled
      FROM whatsapp_messages
      GROUP BY session_id
      ORDER BY last_message DESC
      LIMIT 20
    `);
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function WhatsAppPage() {
  const conversations = await getConversations();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <AutoRefresh interval={5000} />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Smartphone size={36} color="#25D366" /> Monitoreo WhatsApp
          </h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            Supervisa las conversaciones de Evolution API en tiempo real.
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {conversations.length === 0 ? (
          <div className="card glass" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <Smartphone size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p style={{ color: 'var(--muted-foreground)' }}>Las charlas de WhatsApp aparecerán aquí una vez que Evolution API esté conectada.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.session_id} href={`/whatsapp/${conv.session_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card glass conversation-card" style={{ 
                padding: '1.5rem', 
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'all 0.3s ease',
                background: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '14px', 
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white',
                      flexShrink: 0
                    }}>
                      <User size={24} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontWeight: 700, 
                        fontSize: '1rem',
                        color: '#1a1a1a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {conv.push_name || `+${conv.session_id}`}
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <Clock size={12} /> {new Date(conv.last_message).toLocaleString('es-VE', { 
                          timeZone: 'America/Caracas', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <DeleteChatButton sessionId={conv.session_id} />
                      <div style={{ 
                        background: 'rgba(37, 211, 102, 0.1)', 
                        color: '#128C7E', 
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '8px', 
                        fontSize: '0.7rem', 
                        fontWeight: 800
                      }}>
                        {conv.total_messages} MSG
                      </div>
                    </div>
                    <span style={{ fontSize: '0.6rem', background: '#25D366', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, textTransform: 'uppercase' }}>WhatsApp</span>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '0.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f5f5f5',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  color: '#128C7E', 
                  fontSize: '0.85rem', 
                  fontWeight: 600 
                }}>
                  Ver chat completo
                  <ChevronRight size={18} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
