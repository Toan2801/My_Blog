import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getArticleBySlug, getAllArticles } from '@/lib/data';
import CanvasReader from '@/components/CanvasReader';
import { auth } from '@/auth';
import type { Metadata } from 'next';
import { renderArticleMarkdown } from '@/lib/markdown';
import { paginateHTML } from '@/lib/paginate';
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

/** Scan per-page markdown for h1/h2/h3 headings and pair each with the page number. */
function buildTocEntries(
  markdownPages?: Array<{ pageNumber: number; markdown?: string; html?: string }>,
): Array<{ level: number; text: string; pageNumber: number }> {
  const entries: Array<{ level: number; text: string; pageNumber: number }> = [];
  if (!Array.isArray(markdownPages)) return entries;
  for (const p of markdownPages) {
    if (p.markdown) {
      const re = /^(#{1,3})\s+(.+?)\s*$/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(p.markdown)) !== null) {
        const text = m[2].replace(/\\(.)/g, '$1').trim();
        if (/^mục lục$/i.test(text)) continue;
        entries.push({ level: m[1].length, text, pageNumber: p.pageNumber });
      }
    } else if (p.html) {
      const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(p.html)) !== null) {
        const text = m[2].replace(/<[^>]+>/g, '').trim();
        if (/^mục lục$/i.test(text)) continue;
        entries.push({ level: parseInt(m[1], 10), text, pageNumber: p.pageNumber });
      }
    }
  }
  return entries;
}

/** Scan for 【Khảo dị】 notes and pair each with its page number. */
function extractNotes(
  pages?: Array<{ pageNumber: number; html?: string }>,
): Array<{ text: string; pageNumber: number }> {
  const entries: Array<{ text: string; pageNumber: number }> = [];
  if (!Array.isArray(pages)) return entries;
  for (const p of pages) {
    if (!p.html) continue;
    const re = /<div class="article-note">([\s\S]*?)<\/div>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(p.html)) !== null) {
      // Clean HTML tags and the label for a clean sidebar snippet
      const text = m[1]
        .replace(/<span class="note-label">.*?<\/span>/, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (text) entries.push({ text, pageNumber: p.pageNumber });
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

  if (!article || article.status !== 'published') {
    notFound();
  }
  
  // Feature suspended
  notFound();
  return null; // Ensure unreachable code is recognized or doesn't matter

  const session = await auth();
  const trial = !session?.user?.id;

  const htmlContent = renderArticleMarkdown(article.content);
  const { pages: dynamicPages } = paginateHTML(htmlContent, 850);
  
  // Merge image metadata with markdown content
  const allPages = (article.pages && article.pages.length > 0)
    ? article.pages.map(p => {
        const mdPage = article.markdownPages?.find(mp => mp.pageNumber === p.pageNumber);
        return {
          pageNumber: p.pageNumber,
          html: p.html || renderArticleMarkdown(p.markdown || mdPage?.markdown || '')
        };
      })
    : dynamicPages.map((html, i) => ({ pageNumber: i + 4, html }));

  // Fix: Use markdownPages for TOC if available, otherwise use allPages
  const tocEntries = (article.markdownPages && article.markdownPages.length > 0)
    ? buildTocEntries(article.markdownPages)
    : buildTocEntries(allPages);
    
  const notes = extractNotes(allPages);

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
        notes={notes}
        trial={trial}
      />
    </Suspense>
  );
}
