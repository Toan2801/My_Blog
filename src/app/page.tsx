import Link from 'next/link';
import { getSiteConfig, getAllArticles, getAllSeries } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';
import TiltCard from '@/components/TiltCard';

export const metadata: Metadata = {
  title: 'Trang Chủ',
};

export default function HomePage() {
  const config = getSiteConfig();
  const allArticles = getAllArticles();
  const allSeries = getAllSeries();

  // Standalone articles (not part of a series)
  const regularArticles = allArticles.filter(a => !a.series);

  // Featured series by type
  const featuredSeriesArticles = allSeries.filter(s => s.featured && s.type === 'articles' && s.status === 'published');
  const featuredSeriesTranslations = allSeries.filter(s => s.featured && s.type === 'translation' && s.status === 'published');

  // Fill remaining slots (max 6 per section) with standalone featured articles
  const remainingArticleSlots = Math.max(0, 6 - featuredSeriesArticles.length);
  const remainingTranslationSlots = Math.max(0, 6 - featuredSeriesTranslations.length);

  const featuredOriginals = regularArticles.filter(a => a.type === 'articles' && a.featured).slice(0, remainingArticleSlots);
  const featuredTranslations = regularArticles.filter(a => a.type === 'translation' && a.featured).slice(0, remainingTranslationSlots);

  const showFeaturedOriginals = featuredOriginals.length > 0 || featuredSeriesArticles.length > 0;
  const showFeaturedTranslations = featuredTranslations.length > 0 || featuredSeriesTranslations.length > 0;

  const imgBoxStyle: React.CSSProperties = {
    height: '180px',
    overflow: 'hidden',
    background: 'var(--parchment, #f5f0e8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties;

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'transform 0.5s ease',
  };

  return (
    <>
      <div className="container" style={{ paddingTop: 0 }}>

        {/* Featured Articles Section */}
        {showFeaturedOriginals && (
          <section className="featured-articles-showcase" style={{ marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--ink)', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-3)', borderBottom: '2px solid var(--gold)', textAlign: 'center' }}>Bài viết nổi bật</h2>
            <div className="series-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
              {featuredSeriesArticles.map(series => (
                <TiltCard key={series.slug}>
                  <div className="series-card admin-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {series.coverImage && (
                      <Link href={`/series/${series.slug}`} style={imgBoxStyle}>
                        <img src={series.coverImage} alt={series.title} style={imgStyle} />
                      </Link>
                    )}
                    <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '4px' }}>Series</span>
                      <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)', marginBottom: 'var(--space-4)' }}>
                        <Link href={`/series/${series.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{series.title}</Link>
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: '1.6', flex: 1, marginBottom: 'var(--space-4)' }}>
                        {series.description.length > 150 ? series.description.substring(0, 150) + '...' : series.description}
                      </p>
                      <div style={{ marginTop: 'auto' }}>
                        <Link href={`/series/${series.slug}`} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                          Xem trọn bộ
                        </Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              ))}
              {featuredOriginals.map(article => (
                <TiltCard key={article.slug}>
                  <div className="series-card admin-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {article.coverImage && (
                      <Link href={`/articles/${article.slug}`} style={imgBoxStyle}>
                        <img src={article.coverImage} alt={article.title} style={imgStyle} />
                      </Link>
                    )}
                    <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '4px' }}>{article.category}</span>
                      <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)', marginBottom: 'var(--space-4)' }}>
                        <Link href={`/articles/${article.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{article.title}</Link>
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: '1.6', flex: 1, marginBottom: 'var(--space-4)' }}>
                        {article.excerpt.length > 150 ? article.excerpt.substring(0, 150) + '...' : article.excerpt}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(article.date)}</span>
                        <Link href={`/articles/${article.slug}`} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                          Đọc tiếp
                        </Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </section>
        )}

        {/* Featured Translations Section */}
        {showFeaturedTranslations && (
          <section className="featured-translations-showcase" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--ink)', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-3)', borderBottom: '2px solid var(--gold)', textAlign: 'center' }}>Bài dịch nổi bật</h2>
            <div className="series-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
              {featuredSeriesTranslations.map(series => (
                <TiltCard key={series.slug}>
                  <div className="series-card admin-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {series.coverImage && (
                      <Link href={`/series/${series.slug}`} style={imgBoxStyle}>
                        <img src={series.coverImage} alt={series.title} style={imgStyle} />
                      </Link>
                    )}
                    <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '4px' }}>Series</span>
                      <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)', marginBottom: 'var(--space-4)' }}>
                        <Link href={`/series/${series.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{series.title}</Link>
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: '1.6', flex: 1, marginBottom: 'var(--space-4)' }}>
                        {series.description.length > 150 ? series.description.substring(0, 150) + '...' : series.description}
                      </p>
                      <div style={{ marginTop: 'auto' }}>
                        <Link href={`/series/${series.slug}`} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                          Xem trọn bộ
                        </Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              ))}
              {featuredTranslations.map(article => (
                <TiltCard key={article.slug}>
                  <div className="series-card admin-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {article.coverImage && (
                      <Link href={`/articles/${article.slug}`} style={imgBoxStyle}>
                        <img src={article.coverImage} alt={article.title} style={imgStyle} />
                      </Link>
                    )}
                    <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '4px' }}>{article.category}</span>
                      <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)', marginBottom: 'var(--space-4)' }}>
                        <Link href={`/articles/${article.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{article.title}</Link>
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: '1.6', flex: 1, marginBottom: 'var(--space-4)' }}>
                        {article.excerpt.length > 150 ? article.excerpt.substring(0, 150) + '...' : article.excerpt}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(article.date)}</span>
                        <Link href={`/articles/${article.slug}`} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                          Đọc tiếp
                        </Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
