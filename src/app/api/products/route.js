import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Start a "transaction" manually since pg doesn't have a simple wrapper here
    // In a real app, use a proper transaction
    
    // 1. Insert Product
    const productRes = await query(
      `INSERT INTO products (name, slug, description, price, category_id, status, stock) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [name, slug, description, price, category_id || null, status, stock]
    );

    const productId = productRes.rows[0].id;

    // 2. Insert Images
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await query(
          `INSERT INTO product_images (product_id, url, sort_order, is_main) 
           VALUES ($1, $2, $3, $4)`,
          [productId, images[i], i, i === 0]
        );
      }
    }

    return NextResponse.json({ success: true, productId });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const res = await query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `);
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
