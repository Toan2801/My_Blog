import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleBySlug, getAllArticles, getRelatedArticles, getSiteConfig } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import TableOfContents from '@/components/TableOfContents';
import ArticleBody from '@/components/ArticleBody';
import CommentSection from '@/components/CommentSection';
import ZenToggle from '@/components/ZenToggle';
import VoiceReader from '@/components/VoiceReader';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Không tìm thấy' };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  const config = getSiteConfig();

  if (!article) notFound();
  if (article.status !== 'published') notFound();

  const allArticles = getAllArticles();
  const related = getRelatedArticles(article, allArticles);

  return (
    <article>
      {/* Main Content Area */}
      <div className="container" style={{ marginTop: 'var(--space-8)' }}>
        <header className="article-detail-header" style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <p className="article-header-category" style={{ marginBottom: 'var(--space-2)' }}>{article.category}</p>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: 'var(--space-4)', lineHeight: 1.2 }}>{article.title}</h1>
          {article.subtitle && <p className="article-subtitle" style={{ fontSize: '1.2rem', marginBottom: 'var(--space-4)' }}>{article.subtitle}</p>}
          <div className="article-meta" style={{ color: 'var(--ink-muted)', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
            <span>{article.author}</span>
            <span className="sep">·</span>
            <span>{formatDate(article.date)}</span>
            <span className="sep">·</span>
            <span>{article.readingTime} phút đọc</span>
          </div>
          {article.tags.length > 0 && (
            <div className="article-tags" style={{ justifyContent: 'center' }}>
              {article.tags.map(tag => (
                <Link key={tag} href={`/articles?search=${tag}`} className="tag-chip" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>#{tag}</Link>
              ))}
            </div>
          )}
          <VoiceReader />
          <div style={{ width: '60px', height: '2px', background: 'var(--gold)', margin: '16px auto 0' }} />
        </header>
      </div>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="container" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="article-cover-container">
            <img
              src={article.coverImage}
              alt={article.title}
              className="article-cover-full"
            />
          </div>
        </div>
      )}

      {/* Reading Layout */}
      <div className="container">
        <div className="article-reading-layout">
          {/* TOC */}
          <div className="article-sidebar">
            <TableOfContents />
          </div>

          {/* Body */}
          <div>
            {article.series && (
              <div className="series-nav-top admin-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', borderLeft: '4px solid var(--gold)' }}>
                <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '8px' }}>
                  Thuộc loạt bài viết: <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{article.series}</span> (Phần {article.seriesOrder})
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {(() => {
                    const seriesArticles = allArticles
                      .filter(a => a.series === article.series)
                      .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
                    const currentIndex = seriesArticles.findIndex(a => a.slug === article.slug);
                    const prev = seriesArticles[currentIndex - 1];
                    const next = seriesArticles[currentIndex + 1];

                    return (
                      <>
                        {prev ? (
                          <Link href={`/articles/${prev.slug}`} style={{ fontSize: '0.9rem', color: 'var(--gold)' }}>
                            ← Phần trước
                          </Link>
                        ) : <span />}

                        {next ? (
                          <Link href={`/articles/${next.slug}`} style={{ fontSize: '0.9rem', color: 'var(--gold)' }}>
                            Phần tiếp theo →
                          </Link>
                        ) : <span />}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <ArticleBody content={article.content} />

            {article.series && (
              <div className="series-nav-bottom admin-card" style={{ padding: 'var(--space-6)', marginTop: 'var(--space-8)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--gold)', marginBottom: 'var(--space-4)' }}>{article.series}</p>
                <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {allArticles
                    .filter(a => a.series === article.series)
                    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0))
                    .map(a => (
                      <Link
                        key={a.slug}
                        href={`/articles/${a.slug}`}
                        className={`chapter-link ${a.slug === article.slug ? 'active' : ''}`}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          background: a.slug === article.slug ? 'var(--gold)' : 'rgba(212, 175, 55, 0.1)',
                          color: a.slug === article.slug ? 'var(--paper)' : 'var(--ink)',
                          border: '1px solid var(--gold)'
                        }}
                      >
                        Phần {a.seriesOrder}
                      </Link>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Footnotes Display */}
            {article.footnotes && article.footnotes.length > 0 && (
              <div className="footnotes-section" style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-5)', borderTop: '2px solid var(--border-light)' }}>
                <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 'var(--space-4)' }}>
                  Chú thích & Tài liệu tham khảo
                </h3>
                <ol style={{ paddingLeft: 'var(--space-5)', listStyleType: 'none' }}>
                  {article.footnotes.map((fn) => (
                    <li key={fn.id} id={`fn-${fn.num}`} style={{ marginBottom: 'var(--space-2)', fontSize: '0.92rem', color: 'var(--ink-light)', lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--gold)', marginRight: '8px' }}>[{fn.num}]</span>
                      {fn.content}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Related Posts */}
            {related.length > 0 && (
              <div className="related-posts">
                <h2 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-2)' }}>Bài viết liên quan</h2>
                <div className="related-grid">
                  {related.map(r => (
                    <Link key={r.slug} href={`/articles/${r.slug}`} className="related-card">
                      <span className="related-card-category">{r.category}</span>
                      <span className="related-card-title">{r.title}</span>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 'auto' }}>{formatDate(r.date)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <CommentSection slug={article.slug} />
          </div>
        </div>
      </div>
      <ZenToggle />
    </article>
  );
}
