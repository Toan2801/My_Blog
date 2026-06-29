import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// NOTE: We intentionally avoid importing from '@/lib/data' here.
// That module reads from the 'data/articles/' directory, which causes
// Vercel's file tracing to bundle all article JSON files (~200MB) into
// this tiny function, pushing it over the 250MB size limit.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('qr') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    mkdirSync(uploadDir, { recursive: true });

    const filename = `qr-${Date.now()}${file.name.match(/\.[^.]+$/)?.[0] || '.png'}`;
    writeFileSync(join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;

    // Read and update config.json directly (avoids importing @/lib/data)
    const configPath = join(process.cwd(), 'data', 'config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    config.donation.qrImage = url;
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    return NextResponse.json({ success: true, url });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
