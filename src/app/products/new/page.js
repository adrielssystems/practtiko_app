import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/Products/ProductForm";

async function getCategories() {
    try {
        const res = await query("SELECT id, name FROM categories ORDER BY name ASC");
        return res.rows;
    } catch (e) {
        console.error("Error fetching categories:", e);
        return [];
    }
}

export default async function NewProductPage() {
    const categories = await getCategories();

    async function createProduct(formData) {
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
            // 1. Insertar producto base
            const productRes = await query(`
                INSERT INTO products (name, code, description, price_bcv, price_cash, stock, category_id, status, video_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `, [name, code, description, price_bcv, price_cash, stock, category_id, status, video_url]);

            const productId = productRes.rows[0].id;

            // 2. Insertar imágenes relacionadas
            if (images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    await query(`
                        INSERT INTO product_images (product_id, url, is_main, sort_order)
                        VALUES ($1, $2, $3, $4)
                    `, [productId, images[i], i === 0, i]);
                }
            }

            revalidatePath("/products");
        } catch (e) {
            console.error("Error creating product with media:", e);
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
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Nuevo Producto</h1>
            </header>

            <ProductForm categories={categories} onSubmitAction={createProduct} />
        </div>
    );
}
