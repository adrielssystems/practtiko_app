"use client";
import { useState } from "react";
import { Power, PowerOff } from "lucide-react";

export default function GlobalBotBreaker({ initialEnabled }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const toggleBot = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/global-pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled })
      });
      if (res.ok) {
        setEnabled(!enabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleBot}
      disabled={loading}
      style={{
        background: enabled ? '#10b981' : '#ef4444',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        fontWeight: 800,
        fontSize: '0.85rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: enabled ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(239, 68, 68, 0.3)',
        transition: 'all 0.2s',
        opacity: loading ? 0.7 : 1
      }}
    >
      {enabled ? <Power size={18} /> : <PowerOff size={18} />}
      {enabled ? 'IA ENCENDIDA' : 'BREAKER OFF (IA APAGADA)'}
    </button>
  );
}
