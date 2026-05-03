import { query } from "@/lib/db";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2 } from "lucide-react";

async function getProducts() {
  try {
    const res = await query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `);
    return res.rows;
  } catch (e) {
    console.error("Error fetching products:", e);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Productos</h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>Gestiona el catálogo de productos de tu tienda.</p>
        </div>
        <Link href="/products/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Plus size={20} />
          Nuevo Producto
        </Link>
      </header>

      <div className="card glass" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              className="input-field" 
              style={{ paddingLeft: '3rem' }}
            />
          </div>
          <button className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <Filter size={18} />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Producto</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Categoría</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Precio</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Estado</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Stock</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                  No se encontraron productos. Comienza creando uno nuevo.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', background: 'var(--secondary)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        {/* Image placeholder */}
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
                          <Package size={20} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                      {product.category_name || 'Sin categoría'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>
                    ${parseFloat(product.price).toLocaleString()}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className={`badge ${product.status === 'active' ? 'badge-success' : ''}`} style={product.status !== 'active' ? { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--muted-foreground)' } : {}}>
                      {product.status === 'active' ? 'Activo' : 'Borrador'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {product.stock}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Link href={`/products/${product.id}/edit`} className="nav-link" style={{ padding: '0.5rem' }}>
                        <Edit size={18} />
                      </Link>
                      <button className="nav-link" style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--destructive)' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .table-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
}
