import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const COMMENTS_DIR = join(process.cwd(), 'data', 'comments');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const filePath = join(COMMENTS_DIR, `${slug}.json`);
  if (!existsSync(filePath)) return NextResponse.json([]);

  try {
    const raw = readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, author, text } = await req.json();
    if (!slug || !author || !text) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!existsSync(COMMENTS_DIR)) mkdirSync(COMMENTS_DIR, { recursive: true });

    const filePath = join(COMMENTS_DIR, `${slug}.json`);
    let comments = [];
    if (existsSync(filePath)) {
      comments = JSON.parse(readFileSync(filePath, 'utf-8'));
    }

    const newComment = {
      id: Date.now().toString(),
      author,
      text,
      date: new Date().toISOString(),
    };

    comments.push(newComment);
    writeFileSync(filePath, JSON.stringify(comments, null, 2));

    return NextResponse.json(newComment);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
