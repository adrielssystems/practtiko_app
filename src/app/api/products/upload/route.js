import { NextResponse } from 'next/server';
import { processImage, processVideo } from '@/lib/media';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let result;

    if (type === 'video') {
      result = await processVideo(buffer, file.name);
    } else {
      result = await processImage(buffer);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[UPLOAD ERROR]:', error);
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 });
  }
}
