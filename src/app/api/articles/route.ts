import { NextRequest, NextResponse } from 'next/server';
import { saveArticle, deleteArticle, getAllArticlesAdmin } from '@/lib/data';
import { Article } from '@/lib/types';
import { execFile } from 'child_process';
import path from 'path';

/** Fire-and-forget rasterization for a single article. */
function triggerRasterize(slug: string) {
  const script = path.join(process.cwd(), 'scripts', 'rasterize-articles.ts');
  const tsx = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
  execFile(tsx, [script, `--slug=${slug}`], { cwd: process.cwd() }, (err) => {
    if (err) console.error(`Rasterize error for ${slug}:`, err.message);
    else console.log(`Rasterize complete: ${slug}`);
  });
}

export async function POST(req: NextRequest) {
  try {
    const article: Article = await req.json();
    if (!article.slug || !article.title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề hoặc slug' }, { status: 400 });
    }
    saveArticle(article);

    // Trigger rasterization in the background for published articles
    if (article.status === 'published' && article.content) {
      triggerRasterize(article.slug);
    }

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

    // Re-rasterize on update for published articles
    if (article.status === 'published' && article.content) {
      triggerRasterize(article.slug);
    }

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
