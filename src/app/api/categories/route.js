import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const res = await query("SELECT * FROM categories ORDER BY name ASC");
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug } = await request.json();

    const res = await query(
      "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id",
      [name, slug]
    );

    return NextResponse.json({ success: true, id: res.rows[0].id });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
