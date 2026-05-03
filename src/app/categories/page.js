import { query } from "@/lib/db";
import Link from "next/link";
import { Plus, Tag, Edit, Trash2, ChevronRight } from "lucide-react";

async function getCategories() {
  try {
    const res = await query(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id 
      ORDER BY c.name ASC
    `);
    return res.rows;
  } catch (e) {
    console.error("Error fetching categories:", e);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Categorías</h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>Organiza tus productos por grupos.</p>
        </div>
        <Link href="/categories/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Plus size={20} />
          Nueva Categoría
        </Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {categories.length === 0 ? (
          <div className="card glass" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            No hay categorías creadas. Comienza añadiendo una para organizar tu catálogo.
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="card glass category-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.625rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.75rem', color: 'var(--primary)' }}>
                  <Tag size={20} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/categories/${cat.id}/edit`} className="nav-link" style={{ padding: '0.4rem' }}>
                    <Edit size={16} />
                  </Link>
                  <button className="nav-link" style={{ padding: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--destructive)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>{cat.name}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>/{cat.slug}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{cat.product_count} Productos</span>
                <Link href={`/products?category=${cat.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ver Productos <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
