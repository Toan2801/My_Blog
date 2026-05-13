import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeriesBySlug, getArticlesBySeries, getSiteConfig } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import Breadcrumb from '@/components/Breadcrumb';
import SupportQR from '@/components/SupportQR';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) return { title: 'Không tìm thấy series' };
  return {
    title: `${series.title} - Series`,
    description: series.description,
  };
}

export default async function SeriesLandingPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) notFound();

  const articles = getArticlesBySeries(series.title);
  const config = getSiteConfig();

  return (
    <div className="container" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
      <Breadcrumb items={[
        { label: 'Bài viết', href: '/articles' },
        { label: series.title },
      ]} />

      <header style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        {series.coverImage && (
          <div style={{ marginBottom: 'var(--space-6)', maxWidth: '300px', margin: '0 auto var(--space-6)' }}>
            <img
              src={series.coverImage}
              alt={series.title}
              style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)' }}
            />
          </div>
        )}
        <span className="featured-badge" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
          Series {series.type === 'translation' ? 'Dịch' : 'Viết'}
        </span>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: 'var(--space-4)' }}>{series.title}</h1>
        <div
          style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1rem', color: 'var(--ink-light)', lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: series.description.replace(/\n/g, '<br/>') }}
        />
      </header>

      <SupportQR qrImage={config.donation.qrImage} facebookUrl={config.facebook} />

      {/* Book-cover grid */}
      <section style={{ marginTop: 'var(--space-8)' }}>
        <p className="section-label">Các phần ({articles.length})</p>
        <div className="series-book-grid">
          {articles.map((article, index) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} className="book-cover-card">
              {article.coverImage ? (
                <img src={article.coverImage} alt={article.title} className="book-cover-image" />
              ) : (
                <div className="book-cover-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif)' }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
              )}
              <span className="book-cover-title">{article.title}</span>
              <span className="book-cover-meta">{article.readingTime} phút đọc</span>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ marginTop: 'var(--space-10)', textAlign: 'center' }}>
        <Link href="/" className="btn-secondary" style={{ display: 'inline-block', padding: '12px 32px' }}>← Trở về trang chủ</Link>
      </div>
    </div>
  );
}
