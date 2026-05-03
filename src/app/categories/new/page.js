"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Tag } from "lucide-react";

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  // Auto-generate slug from name
  useEffect(() => {
    const slug = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData(prev => ({ ...prev, slug }));
  }, [formData.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create category");

      router.push("/categories");
      router.refresh();
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Error al crear la categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <Link href="/categories" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          Volver a categorías
        </Link>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Nueva Categoría</h1>
      </header>

      <form onSubmit={handleSubmit} className="card glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', color: 'var(--primary)', width: 'fit-content' }}>
          <Tag size={32} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.5rem', display: 'block' }}>Nombre de la Categoría</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej. Sofás de Lujo"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.5rem', display: 'block' }}>Slug (URL)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="sofas-de-lujo"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Crear Categoría
        </button>
      </form>

      <style jsx>{`
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
