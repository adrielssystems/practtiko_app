import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft, User, Bot, Phone } from "lucide-react";

async function getChatHistory(sessionId) {
  try {
    const res = await query(`
      SELECT * FROM tiiko_whatsapp_memory 
      WHERE session_id = $1 
      ORDER BY created_at ASC
    `, [sessionId]);
    
    return res.rows.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      ...row.message
    }));
  } catch (e) {
    console.error("Error fetching whatsapp history:", e);
    return [];
  }
}

export default async function WhatsAppDetailPage({ params }) {
  const { id } = await params;
  const history = await getChatHistory(id);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/whatsapp" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', textDecoration: 'none', marginBottom: '1rem' }}>
          <ArrowLeft size={16} />
          Volver al listado
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <div style={{ background: '#25D366', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
            <Phone color="white" size={20} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Chat WhatsApp: {id}</h1>
        </div>
      </header>

      <div className="card glass" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', minHeight: '60vh' }}>
        {history.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>No hay mensajes en esta conversación.</p>
        ) : (
          history.map((msg, index) => {
            const isBot = msg.role === 'assistant' || msg.role === 'ai' || msg.type === 'ai';
            return (
              <div key={index} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: isBot ? 'flex-start' : 'flex-end',
                width: '100%'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '0.25rem',
                  flexDirection: isBot ? 'row' : 'row-reverse'
                }}>
                  {isBot ? <Bot size={14} color="#128C7E" /> : <User size={14} color="#25D366" />}
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>
                    {isBot ? 'AGENTE VIRTUAL' : 'CLIENTE'}
                  </span>
                </div>
                
                <div style={{ 
                  maxWidth: '85%',
                  padding: '1rem',
                  borderRadius: isBot ? '2px 16px 16px 16px' : '16px 2px 16px 16px',
                  background: isBot ? 'rgba(18, 140, 126, 0.05)' : 'rgba(37, 211, 102, 0.05)',
                  border: `1px solid ${isBot ? 'rgba(18, 140, 126, 0.1)' : 'rgba(37, 211, 102, 0.1)'}`,
                  color: 'var(--foreground)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content || msg.text || JSON.stringify(msg)}
                </div>
                
                <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                   {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
