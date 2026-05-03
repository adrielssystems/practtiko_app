import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Use /data if it exists, otherwise public/uploads for local dev
    // In production, the user should mount the volume to public/uploads or define UPLOAD_PATH
    const uploadDir = process.env.UPLOAD_PATH || path.join(process.cwd(), "public", "uploads");
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Ignore if directory already exists
    }

    const uploadedUrls = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${uuidv4()}.webp`;
      const filePath = path.join(uploadDir, fileName);

      // Process with Sharp: Resize and convert to WebP
      await sharp(buffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(filePath);

      // Return the URL relative to the public folder
      // If mounted at public/uploads, the URL is /uploads/filename
      uploadedUrls.push(`/uploads/${fileName}`);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
