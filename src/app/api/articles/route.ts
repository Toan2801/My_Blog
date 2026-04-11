import { NextRequest, NextResponse } from 'next/server';
import { saveArticle, deleteArticle, getAllArticlesAdmin } from '@/lib/data';
import { Article } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const article: Article = await req.json();
    if (!article.slug || !article.title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề hoặc slug' }, { status: 400 });
    }
    saveArticle(article);
    return NextResponse.json({ success: true, slug: article.slug });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const article: Article = await req.json();
    if (!article.slug || !article.title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề hoặc slug' }, { status: 400 });
    }
    saveArticle(article);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Cần slug' }, { status: 400 });
  deleteArticle(slug);
  return NextResponse.json({ success: true });
}

export async function GET() {
  const articles = getAllArticlesAdmin();
  return NextResponse.json(articles);
}
