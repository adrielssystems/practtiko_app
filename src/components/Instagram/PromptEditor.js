"use client";

import { useState, useTransition } from "react";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function PromptEditor({ initialPrompt, onSaveAction }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked, prompt length:", prompt.length);
    
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        
        await onSaveAction(formData);
        addToast("Prompt guardado correctamente", "success");
      } catch (error) {
        console.error("Save error:", error);
        addToast("Error al guardar el prompt", "error");
      }
    });
  };

  return (
    <div className="card glass" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(4, 119, 191, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          <Save size={20} color="var(--primary)" />
        </div>
        <h3 style={{ margin: 0 }}>Instrucciones del Agente (Prompt)</h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
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
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isPending}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />
              Guardar Cambios
            </>
          )}
        </button>
      </form>
      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
