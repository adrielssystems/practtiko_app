import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { RefreshCcw, ShieldCheck, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import PromptEditor from "@/components/Instagram/PromptEditor";

async function getSettings() {
  const res = await query("SELECT value FROM app_settings WHERE key = 'ai_prompt'");
  return res.rows[0]?.value || "";
}

async function checkInstagramConnection() {
  const rawToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  if (!rawToken) return { status: 'error', message: 'Token de acceso no configurado en Easypanel.' };
  
  const token = rawToken.trim();

  try {
    console.log(`[DEBUG] Probando conexión con token (largo: ${token.length}, inicio: ${token.substring(0, 10)}...)`);
    // Usamos graph.instagram.com ya que el token empieza por IGAA
    const res = await fetch(`https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${token}`);
    const data = await res.json();
    if (data.error) {
      console.error("[DEBUG] Error de Meta:", data.error);
      return { status: 'error', message: data.error.message };
    }
    return { status: 'success', name: data.username, id: data.id };
  } catch (e) {
    return { status: 'error', message: 'Error de red al conectar con Meta.' };
  }
}

async function updatePrompt(formData) {
  "use server";
  try {
    const newPrompt = formData.get("prompt");
    await query("UPDATE app_settings SET value = $1 WHERE key = 'ai_prompt'", [newPrompt]);
    revalidatePath("/instagram/config");
  } catch (error) {
    console.error("[ERROR] Fallo al guardar el prompt:", error);
    throw error;
  }
}

export default async function InstagramConfigPage() {
  const prompt = await getSettings();
  const connection = await checkInstagramConnection();

  return (
    <div style={{ maxWidth: '900px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Configuración de IA</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Controla el comportamiento del bot y verifica la sincronización.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
        {/* Editor de Prompt (Client Component) */}
        <PromptEditor initialPrompt={prompt} onSaveAction={updatePrompt} />

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
