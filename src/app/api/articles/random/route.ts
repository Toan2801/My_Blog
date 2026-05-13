import { NextResponse } from 'next/server';
import { getCachedArticleSlugs } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const slugs = await getCachedArticleSlugs();
  if (slugs.length === 0) {
    return NextResponse.redirect(new URL('/articles', process.env.NEXT_PUBLIC_SITE_URL || 'https://my-blog-taupe-zeta.vercel.app'));
  }

  const randomIndex = Math.floor(Math.random() * slugs.length);
  const randomSlug = slugs[randomIndex];

  const url = new URL(`/articles/${randomSlug}`, process.env.NEXT_PUBLIC_SITE_URL || 'https://my-blog-taupe-zeta.vercel.app');
  return NextResponse.redirect(url, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
