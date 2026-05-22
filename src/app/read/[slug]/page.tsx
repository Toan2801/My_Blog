import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getArticleBySlug } from '@/lib/data';
import { getReaderDocument } from '@/lib/reader-pages';
import CanvasReader from '@/components/CanvasReader';
import { auth } from '@/auth';
import type { Metadata } from 'next';
import type { ArticleMarkdownPage } from '@/lib/types';
import '../reader.css';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Không tìm thấy' };
  return {
    title: `Đọc: ${article.title}`,
    description: article.excerpt,
  };
}

/** Scan per-page markdown for h1/h2/h3 headings and pair each with the page number.
 *  Page 1 is a generated cover page, so its markdown is intentionally ignored.
 */
function buildTocEntries(
  markdownPages?: ArticleMarkdownPage[],
): Array<{ level: number; text: string; pageNumber: number }> {
  const entries: Array<{ level: number; text: string; pageNumber: number }> = [];
  if (!Array.isArray(markdownPages)) return entries;
  for (const p of markdownPages) {
    if (p.pageNumber === 1) continue;
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
  const [article, readerDocument] = await Promise.all([
    getArticleBySlug(slug),
    getReaderDocument(slug),
  ]);

  if (!article || article.status !== 'published' || !readerDocument) notFound();

  const session = await auth();
  const trialRequested = sp.trial === '1';
  const trial = trialRequested && !session?.user?.id;

  // Authenticated → full reader. Anonymous + no trial flag → bounce to login.
  if (!session?.user?.id && !trialRequested) {
    const cb = encodeURIComponent(`/read/${slug}`);
    const { redirect } = await import('next/navigation');
    redirect(`/login?callbackUrl=${cb}`);
  }

  const tocEntries = buildTocEntries(readerDocument.markdownPages);

  return (
    <Suspense fallback={
      <div className="reader-layout">
        <div className="reader-loading fixed inset-0">
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
