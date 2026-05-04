import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/Products/ProductForm";

async function getProduct(id) {
    try {
        const res = await query("SELECT * FROM products WHERE id = $1", [id]);
        const product = res.rows[0];
        if (product) {
            const imagesRes = await query("SELECT url FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC", [id]);
            product.images = imagesRes.rows.map(r => r.url);
        }
        return product;
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
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Producto no encontrado</div>;
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
        
        // Datos de medios
        const images = JSON.parse(formData.get("images") || "[]");
        const video_url = formData.get("video_url") || null;

        try {
            // 1. Actualizar datos base
            await query(`
                UPDATE products 
                SET name = $1, code = $2, description = $3, price_bcv = $4, price_cash = $5, stock = $6, category_id = $7, status = $8, video_url = $9
                WHERE id = $10
            `, [name, code, description, price_bcv, price_cash, stock, category_id, status, video_url, id]);

            // 2. Sincronizar imágenes (Borrar y re-insertar para mantener orden)
            await query("DELETE FROM product_images WHERE product_id = $1", [id]);
            
            if (images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    await query(`
                        INSERT INTO product_images (product_id, url, is_main, sort_order)
                        VALUES ($1, $2, $3, $4)
                    `, [id, images[i], i === 0, i]);
                }
            }

            revalidatePath("/products");
            revalidatePath(`/products/${id}/edit`);
        } catch (e) {
            console.error("Error updating product with media:", e);
            throw e;
        }

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

            <ProductForm categories={categories} initialData={product} onSubmitAction={updateProduct} />
        </div>
    );
}
