import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const productRes = await query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [id]
    );

    if (productRes.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = productRes.rows[0];

    // Get images
    const imagesRes = await query(
      "SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC",
      [id]
    );

    product.images = imagesRes.rows.map(img => img.url);

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      slug, 
      description, 
      price, 
      category_id, 
      status, 
      stock, 
      images 
    } = body;

    // 1. Update Product
    await query(
      `UPDATE products 
       SET name = $1, slug = $2, description = $3, price = $4, category_id = $5, status = $6, stock = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [name, slug, description, price, category_id || null, status, stock, id]
    );

    // 2. Update Images (Delete old and insert new for simplicity, or sync)
    // For simplicity in this version, we delete old image references and add new ones
    // Note: This doesn't delete physical files from /data, which is fine for now
    await query("DELETE FROM product_images WHERE product_id = $1", [id]);

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await query(
          `INSERT INTO product_images (product_id, url, sort_order, is_main) 
           VALUES ($1, $2, $3, $4)`,
          [id, images[i], i, i === 0]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Deleting product (cascade will handle images reference)
    await query("DELETE FROM products WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
