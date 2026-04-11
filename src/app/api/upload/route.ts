import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    mkdirSync(uploadDir, { recursive: true });

    const extension = file.name.match(/\.[^.]+$/)?.[0] || '.jpg';
    const filename = `img-${Date.now()}${extension}`;
    writeFileSync(join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
