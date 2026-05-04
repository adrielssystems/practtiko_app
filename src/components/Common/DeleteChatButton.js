'use client';

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function DeleteChatButton({ sessionId, platform = 'instagram' }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleDelete = async (e) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!window.confirm("¿Estás seguro de que quieres borrar esta conversación? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const endpoint = platform === 'whatsapp' ? "/api/whatsapp/delete-chat" : "/api/instagram/delete-chat";
      
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        addToast("Conversación eliminada", "success");
        // Forzar recarga de datos
        router.refresh();
        // Fallback: si en 1 segundo sigue ahí, forzar reload
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const data = await res.json();
        addToast(`Error: ${data.error || 'No se pudo borrar'}`, "error");
      }
    } catch (error) {
      addToast("Error de conexión", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      title="Borrar conversación"
      style={{ 
        background: 'none', 
        border: 'none', 
        color: isDeleting ? '#ccc' : '#ff4d4d', 
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        padding: '0.5rem',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s'
      }}
      onMouseOver={e => !isDeleting && (e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)')}
      onMouseOut={e => e.currentTarget.style.background = 'none'}
    >
      <Trash2 size={18} />
    </button>
  );
}
