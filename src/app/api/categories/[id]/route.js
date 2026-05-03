import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const res = await query("SELECT * FROM categories WHERE id = $1", [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (error) {
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
    const { name, slug } = await request.json();

    await query(
      "UPDATE categories SET name = $1, slug = $2 WHERE id = $3",
      [name, slug, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if category has products
    const productsRes = await query("SELECT id FROM products WHERE category_id = $1 LIMIT 1", [id]);
    if (productsRes.rows.length > 0) {
      return NextResponse.json({ error: "Cannot delete category with associated products" }, { status: 400 });
    }

    await query("DELETE FROM categories WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
