import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft, User, Bot, Clock } from "lucide-react";

async function getChatHistory(sessionId) {
  try {
    const res = await query(`
      SELECT * FROM tiiko_chat_memory 
      WHERE session_id = $1 
      ORDER BY created_at ASC
    `, [sessionId]);
    
    return res.rows.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      ...row.message
    }));
  } catch (e) {
    console.error("Error fetching history:", e);
    return [];
  }
}

export default async function InstagramDetailPage({ params }) {
  const { id } = await params;
  const history = await getChatHistory(id);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/instagram" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', textDecoration: 'none', marginBottom: '1rem' }}>
          <ArrowLeft size={16} />
          Volver al monitoreo
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Chat: {id.substring(0, 8)}...</h1>
      </header>

      <div className="card glass" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', minHeight: '60vh' }}>
        {history.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>No hay mensajes en esta conversación.</p>
        ) : (
          history.map((msg, index) => {
            const isBot = msg.role === 'assistant' || msg.role === 'ai';
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
                  {isBot ? <Bot size={14} color="var(--primary)" /> : <User size={14} color="var(--secondary)" />}
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>
                    {isBot ? 'AGENTE VIRTUAL' : 'CLIENTE'}
                  </span>
                </div>
                
                <div style={{ 
                  maxWidth: '85%',
                  padding: '1rem',
                  borderRadius: isBot ? '2px 16px 16px 16px' : '16px 2px 16px 16px',
                  background: isBot ? 'rgba(4, 119, 191, 0.05)' : 'rgba(242, 135, 5, 0.05)',
                  border: `1px solid ${isBot ? 'rgba(4, 119, 191, 0.1)' : 'rgba(242, 135, 5, 0.1)'}`,
                  color: 'var(--foreground)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
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
