"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";
import ImageUpload from "@/components/Products/ImageUpload";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    category_id: "",
    status: "draft",
    stock: "0",
    images: []
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        setFormData({
          ...data,
          price: data.price.toString(),
          stock: data.stock.toString(),
          category_id: data.category_id || ""
        });
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Error al cargar el producto");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update product");

      router.push("/products");
      router.refresh();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error al actualizar el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");

      router.push("/products");
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error al eliminar el producto");
    }
  };

  const handleImagesChange = (urls) => {
    setFormData(prev => ({ ...prev, images: urls }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <Link href="/products" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} />
            Volver a productos
          </Link>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Editar Producto</h1>
        </div>
        <button 
          onClick={handleDelete}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--destructive)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600 }}
        >
          <Trash2 size={18} />
          Eliminar
        </button>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* General Information */}
          <div className="card glass">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Información General</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej. Sofá Modular Practiiko"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Slug (URL)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="sofa-modular-practiiko"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '150px', resize: 'vertical' }}
                  placeholder="Describe las características, materiales y beneficios del producto..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="card glass">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Galería de Imágenes</h2>
            <ImageUpload 
              onImagesChange={handleImagesChange} 
              initialImages={formData.images} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status & Category */}
          <div className="card glass">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Organización</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Estado</label>
                <select 
                  className="input-field"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select 
                  className="input-field"
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="1">Sofás</option>
                  <option value="2">Mesas</option>
                  <option value="3">Accesorios</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="card glass">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Precio y Stock</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Precio ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock Disponible</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Actualizar Producto
          </button>
        </div>
      </form>

      <style jsx>{`
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--muted-foreground);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
