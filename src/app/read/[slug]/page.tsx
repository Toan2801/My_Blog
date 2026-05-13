import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getArticleBySlug, getAllArticles } from '@/lib/data';
import CanvasReader from '@/components/CanvasReader';
import { auth } from '@/auth';
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

/** Scan per-page markdown for h1/h2/h3 headings and pair each with the page number.
 *  Pages 1 (cover) and 3 (auto-generated TOC) are skipped since their headings
 *  are scaffolding, not real article sections.
 */
function buildTocEntries(
  markdownPages?: Array<{ pageNumber: number; markdown: string }>,
): Array<{ level: number; text: string; pageNumber: number }> {
  const entries: Array<{ level: number; text: string; pageNumber: number }> = [];
  if (!Array.isArray(markdownPages)) return entries;
  for (const p of markdownPages) {
    if (p.pageNumber === 1 || p.pageNumber === 3) continue;
    const md = p.markdown || '';
    const re = /^(#{1,3})\s+(.+?)\s*$/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(md)) !== null) {
      // Unescape any markdown-escaped char (e.g., `1\.` → `1.`).
      const text = m[2].replace(/\\(.)/g, '$1').trim();
      if (/^mục lục$/i.test(text)) continue;
      entries.push({ level: m[1].length, text, pageNumber: p.pageNumber });
    }
  }
  return entries;
}

interface SearchProps {
  searchParams: Promise<{ trial?: string }>;
}

export default async function ReadPage({ params, searchParams }: Props & SearchProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const article = getArticleBySlug(slug);

  if (!article || article.status !== 'published') notFound();

  const session = await auth();
  const trial = !session?.user?.id;

  const tocEntries = buildTocEntries(article.markdownPages);

  return (
    <Suspense fallback={
      <div className="reader-layout">
        <div className="reader-loading" style={{ position: 'fixed', inset: 0 }}>
          <div className="reader-spinner" />
        </div>
      </div>
    }>
      <CanvasReader
        slug={slug}
        articleTitle={article.title}
        tocEntries={tocEntries}
        trial={trial}
      />
    </Suspense>
  );
}
