"use client";

import { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import MediaUpload from "./MediaUpload";

import { useToast } from "@/components/Toast";

export default function ProductForm({ categories, onSubmitAction, initialData = {} }) {
  const { addToast } = useToast();
  const [media, setMedia] = useState({ 
    images: initialData.images || [], 
    video: initialData.video_url || null 
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleMediaChange = (newMedia) => {
    setMedia(newMedia);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.target);
    formData.append("images", JSON.stringify(media.images));
    formData.append("video_url", media.video || "");

    try {
      await onSubmitAction(formData);
      addToast(initialData.id ? "Cambios guardados con éxito" : "Producto creado con éxito", "success");
    } catch (error) {
      console.error("Error saving product:", error);
      addToast("Error al guardar el producto", "error");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card glass" style={{ padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="label">Nombre del Producto</label>
          <input name="name" type="text" required className="input-field" defaultValue={initialData.name} placeholder="Ej: Sofá Modular Premium" />
        </div>
        <div className="form-group">
          <label className="label">Código (SKU)</label>
          <input name="code" type="text" required className="input-field" defaultValue={initialData.code} placeholder="Ej: SOFA-001" />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="label">Descripción</label>
        <textarea name="description" className="input-field" style={{ minHeight: '100px', resize: 'vertical' }} defaultValue={initialData.description} placeholder="Detalles del producto..."></textarea>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="label">Precio BCV ($)</label>
          <input name="price_bcv" type="number" step="0.01" required className="input-field" defaultValue={initialData.price_bcv} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="label">Precio Divisas ($)</label>
          <input name="price_cash" type="number" step="0.01" required className="input-field" defaultValue={initialData.price_cash} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="label">Stock</label>
          <input name="stock" type="number" required className="input-field" defaultValue={initialData.stock} placeholder="0" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="label">Categoría</label>
          <select name="category_id" className="input-field" required defaultValue={initialData.category_id}>
            <option value="">Seleccionar categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Estado</label>
          <select name="status" className="input-field" defaultValue={initialData.status}>
            <option value="active">Activo</option>
            <option value="draft">Borrador</option>
          </select>
        </div>
      </div>

      {/* COMPONENTE DE MEDIOS */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <MediaUpload onMediaChange={handleMediaChange} initialMedia={{ images: media.images, video: media.video }} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <Link 
          href="/products" 
          className="btn-outline" 
          style={{ 
            padding: '0.75rem 1.5rem', 
            borderRadius: '12px', 
            fontSize: '0.9rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            background: 'white',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#e2e8f0'; }}
        >
          Cancelar
        </Link>
        <button 
          type="submit" 
          disabled={isSaving} 
          className="btn-primary" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(4, 119, 191, 0.25)'
          }}
        >
          {isSaving ? (
            <>
              <Save className="animate-spin" size={18} />
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />
              {initialData.id ? 'Guardar Cambios' : 'Guardar Producto'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
