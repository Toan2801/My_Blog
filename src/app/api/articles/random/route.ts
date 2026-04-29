import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/data';

export async function GET() {
  const articles = getAllArticles();
  if (articles.length === 0) {
    return NextResponse.redirect(new URL('/articles', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  }
  
  const randomIndex = Math.floor(Math.random() * articles.length);
  const randomArticle = articles[randomIndex];
  
  const url = new URL(`/articles/${randomArticle.slug}`, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return NextResponse.redirect(url, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
