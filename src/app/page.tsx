import Link from 'next/link';
import { getSiteConfig, getAllArticles, getAllSeries } from '@/lib/data';
import { getVideos } from '@/lib/video-data';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';
import TiltCard from '@/components/TiltCard';
import HeroSlider from '@/components/HeroSlider';
import HomeSidebar from '@/components/HomeSidebar';

export const metadata: Metadata = {
  title: 'Trang Chủ',
};

export default function HomePage() {
  const config = getSiteConfig();
  const allArticles = getAllArticles();
  const allSeries = getAllSeries();
  const videos = getVideos();

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

  // Hero slides from featured articles
  const heroSlides = allArticles
    .filter(a => a.featured && a.status === 'published')
    .slice(0, 5)
    .map(a => ({
      title: a.title,
      slug: a.slug,
      category: a.category,
      excerpt: a.excerpt?.substring(0, 120) || '',
      coverImage: a.coverImage,
    }));

  // Recent articles for sidebar
  const recentArticles = allArticles
    .filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(a => ({ slug: a.slug, title: a.title, date: a.date }));

  const imgBoxStyle: React.CSSProperties = {
    height: '180px',
    overflow: 'hidden',
    background: 'var(--paper-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'transform 0.5s ease',
  };

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider slides={heroSlides} />

      <div className="container" style={{ paddingTop: 0 }}>
        {/* Main + Sidebar layout */}
        <div className="home-main-sidebar">
          <div>
            {/* Featured Articles Section */}
            {showFeaturedOriginals && (
              <section style={{ marginBottom: 'var(--space-10)' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--ink)', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-3)', borderBottom: '2px solid var(--gold)' }}>Bài viết nổi bật</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                  {featuredSeriesArticles.map(series => (
                    <TiltCard key={series.slug}>
                      <div className="admin-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {series.coverImage && (
                          <Link href={`/series/${series.slug}`} style={imgBoxStyle}>
                            <img src={series.coverImage} alt={series.title} style={imgStyle} />
                          </Link>
                        )}
                        <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '4px' }}>Series</span>
                          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: 'var(--space-3)' }}>
                            <Link href={`/series/${series.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{series.title}</Link>
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', lineHeight: '1.6', flex: 1, marginBottom: 'var(--space-4)' }}>
                            {series.description.length > 120 ? series.description.substring(0, 120) + '...' : series.description}
                          </p>
                          <Link href={`/series/${series.slug}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px', alignSelf: 'flex-start' }}>
                            Xem trọn bộ
                          </Link>
                        </div>
                      </div>
                    </TiltCard>
                  ))}
                  {featuredOriginals.map(article => (
                    <TiltCard key={article.slug}>
                      <div className="admin-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {article.coverImage && (
                          <Link href={`/articles/${article.slug}`} style={imgBoxStyle}>
                            <img src={article.coverImage} alt={article.title} style={imgStyle} />
                          </Link>
                        )}
                        <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '4px' }}>{article.category}</span>
                          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: 'var(--space-3)' }}>
                            <Link href={`/articles/${article.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{article.title}</Link>
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', lineHeight: '1.6', flex: 1, marginBottom: 'var(--space-4)' }}>
                            {article.excerpt.length > 120 ? article.excerpt.substring(0, 120) + '...' : article.excerpt}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{formatDate(article.date)}</span>
                            <Link href={`/articles/${article.slug}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
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
              <section style={{ marginBottom: 'var(--space-10)' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--ink)', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-3)', borderBottom: '2px solid var(--gold)' }}>Bài dịch nổi bật</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                  {featuredSeriesTranslations.map(series => (
                    <TiltCard key={series.slug}>
                      <div className="admin-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {series.coverImage && (
                          <Link href={`/series/${series.slug}`} style={imgBoxStyle}>
                            <img src={series.coverImage} alt={series.title} style={imgStyle} />
                          </Link>
                        )}
                        <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '4px' }}>Series</span>
                          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: 'var(--space-3)' }}>
                            <Link href={`/series/${series.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{series.title}</Link>
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', lineHeight: '1.6', flex: 1, marginBottom: 'var(--space-4)' }}>
                            {series.description.length > 120 ? series.description.substring(0, 120) + '...' : series.description}
                          </p>
                          <Link href={`/series/${series.slug}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px', alignSelf: 'flex-start' }}>
                            Xem trọn bộ
                          </Link>
                        </div>
                      </div>
                    </TiltCard>
                  ))}
                  {featuredTranslations.map(article => (
                    <TiltCard key={article.slug}>
                      <div className="admin-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {article.coverImage && (
                          <Link href={`/articles/${article.slug}`} style={imgBoxStyle}>
                            <img src={article.coverImage} alt={article.title} style={imgStyle} />
                          </Link>
                        )}
                        <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '4px' }}>{article.category}</span>
                          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: 'var(--space-3)' }}>
                            <Link href={`/articles/${article.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{article.title}</Link>
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', lineHeight: '1.6', flex: 1, marginBottom: 'var(--space-4)' }}>
                            {article.excerpt.length > 120 ? article.excerpt.substring(0, 120) + '...' : article.excerpt}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{formatDate(article.date)}</span>
                            <Link href={`/articles/${article.slug}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
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

          {/* Sidebar */}
          <HomeSidebar
            recentArticles={recentArticles}
            categories={config.categories}
            quoteBlock={config.quoteBlock}
          />
        </div>

        {/* Multimedia Section */}
        {videos.length > 0 && (
          <section className="multimedia-section">
            <p className="section-label">Video</p>
            <div className="multimedia-grid">
              {videos.slice(0, 4).map(v => (
                <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="multimedia-card">
                  <div className="multimedia-card-body">
                    <p className="multimedia-card-title">{v.title}</p>
                    {v.description && <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '4px', lineHeight: 1.5 }}>{v.description.substring(0, 80)}</p>}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
