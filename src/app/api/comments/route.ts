import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { articleSlug: slug },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    comments.map((c) => ({
      id: c.id,
      author: c.author,
      text: c.text,
      date: c.createdAt.toISOString(),
    })),
  );
}

export async function POST(req: NextRequest) {
  try {
    const { slug, author, text } = await req.json();
    if (!slug || !author || !text) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: { articleSlug: slug, author, text },
    });

    return NextResponse.json({
      id: comment.id,
      author: comment.author,
      text: comment.text,
      date: comment.createdAt.toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
