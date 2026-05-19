import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const script = path.join(process.cwd(), 'scripts', 'generate-fpt-audio.mjs');

  try {
    await new Promise<void>((resolve, reject) => {
      exec(
        `node scripts/generate-gcp-audio.js ${slug}`,
        { cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 },
        (err) => (err ? reject(err) : resolve()),
      );
    });

    return NextResponse.json({ ok: true, slug, message: 'Audio generated successfully' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
