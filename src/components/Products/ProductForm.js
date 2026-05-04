"use client";

import { useState, useEffect } from "react";
import { Save, Eye, Package, Tag, CreditCard } from "lucide-react";
import Link from "next/link";
import MediaUpload from "./MediaUpload";
import { useToast } from "@/components/Toast";

export default function ProductForm({ categories, onSubmitAction, initialData = {} }) {
  const { addToast } = useToast();
  const [media, setMedia] = useState({ 
    images: initialData.images || [], 
    video: initialData.video_url || null 
  });
  
  // Estado para la previsualización en tiempo real
  const [formValues, setFormValues] = useState({
    name: initialData.name || "",
    code: initialData.code || "",
    price_bcv: initialData.price_bcv || "",
    price_cash: initialData.price_cash || "",
    category_name: ""
  });

  const [isSaving, setIsSaving] = useState(false);

  // Actualizar el nombre de la categoría para el preview
  useEffect(() => {
    if (initialData.category_id && categories.length > 0) {
      const cat = categories.find(c => c.id === parseInt(initialData.category_id));
      if (cat) setFormValues(prev => ({ ...prev, category_name: cat.name }));
    }
  }, [categories, initialData.category_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));

    if (name === "category_id") {
      const cat = categories.find(c => c.id === parseInt(value));
      setFormValues(prev => ({ ...prev, category_name: cat ? cat.name : "" }));
    }
  };

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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
      
      {/* PANEL IZQUIERDO: FORMULARIO */}
      <form onSubmit={handleSubmit} className="card glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="label">Nombre del Producto</label>
            <input 
              name="name" type="text" required className="input-field" 
              defaultValue={initialData.name} placeholder="Ej: Sofá Modular Premium" 
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="label">Código (SKU)</label>
            <input 
              name="code" type="text" required className="input-field" 
              defaultValue={initialData.code} placeholder="Ej: SOFA-001" 
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="label">Descripción</label>
          <textarea name="description" className="input-field" style={{ minHeight: '100px', resize: 'vertical' }} defaultValue={initialData.description} placeholder="Detalles del producto..."></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="label">Precio BCV ($)</label>
            <input 
              name="price_bcv" type="number" step="0.01" required className="input-field" 
              defaultValue={initialData.price_bcv} placeholder="0.00" 
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="label">Precio Divisas ($)</label>
            <input 
              name="price_cash" type="number" step="0.01" required className="input-field" 
              defaultValue={initialData.price_cash} placeholder="0.00" 
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="label">Stock</label>
            <input name="stock" type="number" required className="input-field" defaultValue={initialData.stock} placeholder="0" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="form-group">
            <label className="label">Categoría</label>
            <select name="category_id" className="input-field" required defaultValue={initialData.category_id} onChange={handleInputChange}>
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

        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <MediaUpload onMediaChange={handleMediaChange} initialMedia={{ images: media.images, video: media.video }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <Link href="/products" className="btn-outline" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', color: '#64748b', textDecoration: 'none', fontWeight: 700 }}>
            Cancelar
          </Link>
          <button type="submit" disabled={isSaving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}>
            {isSaving ? <Save className="animate-spin" size={18} /> : <Save size={18} />}
            {initialData.id ? 'Guardar Cambios' : 'Guardar Producto'}
          </button>
        </div>
      </form>

      {/* PANEL DERECHO: PREVIEW (VIEW) */}
      <div style={{ position: 'sticky', top: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 800 }}>
          <Eye size={20} />
          <span>VISTA PREVIA (LANDING)</span>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          {/* Imagen de Portada */}
          <div style={{ width: '100%', height: '240px', background: '#f1f5f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {media.images.length > 0 ? (
              <img src={media.images[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Package size={48} color="#cbd5e1" />
            )}
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.9)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', backdropFilter: 'blur(4px)' }}>
              {formValues.category_name || "Categoría"}
            </div>
          </div>

          {/* Info del Producto */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>{formValues.code || "SKU-000"}</div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#1a1a1a', fontWeight: 800, lineHeight: '1.2' }}>{formValues.name || "Nombre del Producto"}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={14} color="var(--primary)" />
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>${formValues.price_bcv || "0.00"}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>(Tasa BCV)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(4, 119, 191, 0.05)', padding: '0.5rem', borderRadius: '10px', border: '1px dashed var(--primary)' }}>
                <CreditCard size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>${formValues.price_cash || "0.00"}</span>
                <span style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Precio Especial Divisas</span>
              </div>
            </div>

            <button disabled style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', borderRadius: '12px', background: '#1a1a1a', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'not-allowed' }}>
              Comprar Ahora
            </button>
          </div>
        </div>
        
        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
          * Esta es una previsualización de cómo los clientes verán el producto en el catálogo.
        </p>
      </div>
    </div>
  );
}
