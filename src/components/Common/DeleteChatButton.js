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
    // DIAGNÓSTICO AGRESIVO
    window.alert("¡BOTÓN DE BORRADO PULSADO!");
    console.log("BORRANDO SESIÓN:", sessionId);

    e.preventDefault(); 
    e.stopPropagation();

    if (!window.confirm(`¿Seguro que quieres eliminar a ${sessionId}?`)) {
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
        background: '#ff4d4d', // ROJO CHILLÓN PARA PRUEBA
        border: 'none', 
        color: 'white', 
        cursor: 'pointer',
        padding: '0.8rem', // MÁS GRANDE
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1000,
        pointerEvents: 'auto' // FORZAR CLIC
      }}
    >
      <Trash2 size={20} />
    </button>
  );
}
