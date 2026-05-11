import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getArticleBySlug, getAllArticles } from '@/lib/data';
import CanvasReader from '@/components/CanvasReader';
import type { Metadata } from 'next';
import '../reader.css';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles
    .filter(a => a.status === 'published')
    .map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Không tìm thấy' };
  return {
    title: `Đọc: ${article.title}`,
    description: article.excerpt,
  };
}

export default async function ReadPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article || article.status !== 'published') notFound();

  return (
    <Suspense fallback={
      <div className="reader-layout">
        <div className="reader-loading" style={{ position: 'fixed', inset: 0 }}>
          <div className="reader-spinner" />
        </div>
      </div>
    }>
      <CanvasReader slug={slug} articleTitle={article.title} />
    </Suspense>
  );
}
