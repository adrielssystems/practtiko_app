'use client';

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteChatButton({ sessionId }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e) => {
    e.preventDefault(); // Evitar que el Link del padre se active
    e.stopPropagation();

    if (!confirm("¿Estás seguro de que quieres borrar esta conversación? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch("/api/instagram/delete-chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        router.refresh(); // Refrescar la lista de conversaciones
      } else {
        alert("Error al borrar la conversación");
      }
    } catch (error) {
      alert("Error de conexión");
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
