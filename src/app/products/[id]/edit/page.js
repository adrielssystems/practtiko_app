import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Package } from "lucide-react";

async function getProduct(id) {
    try {
        const res = await query("SELECT * FROM products WHERE id = $1", [id]);
        return res.rows[0];
    } catch (e) {
        console.error("Error fetching product:", e);
        return null;
    }
}

async function getCategories() {
    try {
        const res = await query("SELECT id, name FROM categories ORDER BY name ASC");
        return res.rows;
    } catch (e) {
        console.error("Error fetching categories:", e);
        return [];
    }
}

export default async function EditProductPage({ params }) {
    const { id } = await params;
    const product = await getProduct(id);
    const categories = await getCategories();

    if (!product) {
        return <div>Producto no encontrado</div>;
    }

    async function updateProduct(formData) {
        "use server";
        
        const name = formData.get("name");
        const code = formData.get("code");
        const description = formData.get("description");
        const price_bcv = parseFloat(formData.get("price_bcv") || 0);
        const price_cash = parseFloat(formData.get("price_cash") || 0);
        const stock = parseInt(formData.get("stock") || 0);
        const category_id = formData.get("category_id");
        const status = formData.get("status");

        await query(`
            UPDATE products 
            SET name = $1, code = $2, description = $3, price_bcv = $4, price_cash = $5, stock = $6, category_id = $7, status = $8
            WHERE id = $9
        `, [name, code, description, price_bcv, price_cash, stock, category_id, status, id]);

        revalidatePath("/products");
        redirect("/products");
    }

    return (
        <div style={{ maxWidth: '800px' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <Link href="/products" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} />
                    Volver a Productos
                </Link>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Editar Producto</h1>
            </header>

            <form action={updateProduct} className="card glass" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                        <label className="label">Nombre del Producto</label>
                        <input name="name" type="text" required className="input-field" defaultValue={product.name} />
                    </div>
                    <div className="form-group">
                        <label className="label">Código (SKU)</label>
                        <input name="code" type="text" required className="input-field" defaultValue={product.code} />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Descripción</label>
                    <textarea name="description" className="input-field" style={{ minHeight: '100px', resize: 'vertical' }} defaultValue={product.description}></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                        <label className="label">Precio BCV ($)</label>
                        <input name="price_bcv" type="number" step="0.01" required className="input-field" defaultValue={product.price_bcv} />
                    </div>
                    <div className="form-group">
                        <label className="label">Precio Divisas ($)</label>
                        <input name="price_cash" type="number" step="0.01" required className="input-field" defaultValue={product.price_cash} />
                    </div>
                    <div className="form-group">
                        <label className="label">Stock</label>
                        <input name="stock" type="number" required className="input-field" defaultValue={product.stock} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="form-group">
                        <label className="label">Categoría</label>
                        <select name="category_id" className="input-field" defaultValue={product.category_id}>
                            <option value="">Seleccionar categoría</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">Estado</label>
                        <select name="status" className="input-field" defaultValue={product.status}>
                            <option value="active">Activo</option>
                            <option value="draft">Borrador</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <Link href="/products" className="btn-outline">Cancelar</Link>
                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} />
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}
