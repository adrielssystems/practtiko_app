import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Settings, Save, CheckCircle, AlertTriangle, RefreshCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";

async function getSettings() {
  const res = await query("SELECT value FROM tiiko_settings WHERE key = 'ai_prompt'");
  return res.rows[0]?.value || "";
}

async function checkInstagramConnection() {
  const token = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  if (!token) return { status: 'error', message: 'Token de acceso no configurado en Easypanel.' };
  
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`);
    const data = await res.json();
    if (data.error) return { status: 'error', message: data.error.message };
    return { status: 'success', name: data.name, id: data.id };
  } catch (e) {
    return { status: 'error', message: 'Error de red al conectar con Meta.' };
  }
}

export default async function InstagramConfigPage() {
  const prompt = await getSettings();
  const connection = await checkInstagramConnection();

  async function updatePrompt(formData) {
    "use server";
    const newPrompt = formData.get("prompt");
    await query("UPDATE tiiko_settings SET value = $1 WHERE key = 'ai_prompt'", [newPrompt]);
    revalidatePath("/instagram/config");
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Configuración de IA</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Controla el comportamiento del bot y verifica la sincronización.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
        {/* Editor de Prompt */}
        <div className="card glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(4, 119, 191, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <Settings size={20} color="var(--primary)" />
            </div>
            <h3 style={{ margin: 0 }}>Instrucciones del Agente (Prompt)</h3>
          </div>
          
          <form action={updatePrompt}>
            <textarea 
              name="prompt"
              defaultValue={prompt}
              style={{ 
                width: '100%', 
                minHeight: '400px', 
                padding: '1.25rem', 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.5)', 
                border: '1px solid rgba(0,0,0,0.1)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Escribe aquí las instrucciones para el bot..."
            />
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}>
              <Save size={18} />
              Guardar Cambios
            </button>
          </form>
        </div>

        {/* Estado de Integración */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCcw size={16} /> Estado API
            </h4>
            
            {connection.status === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600 }}>
                  <CheckCircle size={20} /> Conectado
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                  Página: <strong>{connection.name}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                  ID: <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px' }}>{connection.id}</code>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 600 }}>
                  <AlertTriangle size={20} /> Desconectado
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  {connection.message}
                </p>
                <Link href="https://developers.facebook.com" target="_blank" className="btn-outline" style={{ fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem' }}>
                  Revisar en Meta
                </Link>
              </div>
            )}
          </div>

          <div className="card glass" style={{ padding: '1.5rem', background: 'rgba(4, 119, 191, 0.05)' }}>
             <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} /> Seguridad
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '0' }}>
              Los cambios en el prompt se aplican al instante para todos los nuevos mensajes entrantes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
