import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
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

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {categories.length === 0 ? (
          <div className="card glass" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <Tag size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No hay categorías</h3>
            <p style={{ color: 'var(--muted-foreground)' }}>Crea categorías para organizar mejor tu catálogo.</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="card glass" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{category.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{category.product_count} productos</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <Link href={`/categories/${category.id}/edit`} className="nav-link" style={{ padding: '0.5rem' }}>
                    <Edit size={16} />
                  </Link>
                  <button className="nav-link" style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--destructive)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <Link href="/products" className="nav-link" style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Ver productos
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
