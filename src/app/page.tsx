import Link from 'next/link';

import { getSiteConfig, getAllArticles, getArticleBySlug } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

import TiltCard from '@/components/TiltCard';


export const metadata: Metadata = {
  title: 'Trang Chủ',
};

export default function HomePage() {
  const config = getSiteConfig();
  const allArticles = getAllArticles();

  // Separate series articles
  const seriesArticles = allArticles.filter(a => a.series);
  const regularArticles = allArticles.filter(a => !a.series);

  // Group by series
  const seriesGroups = seriesArticles.reduce((acc, a) => {
    if (!a.series) return acc;
    if (!acc[a.series]) acc[a.series] = [];
    acc[a.series].push(a);
    return acc;
  }, {} as Record<string, typeof allArticles>);

  // Sort articles within each series by order
  Object.keys(seriesGroups).forEach(name => {
    seriesGroups[name].sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
  });

  // Daily random logic: Pick a featured article based on current date seed
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const featuredIndex = seed % (regularArticles.length || 1);
  const featured = regularArticles[featuredIndex] || allArticles[0] || null;

  const recent = regularArticles.filter(a => a.slug !== featured?.slug).slice(0, 5);
  const suggested = config.suggestedReading
    .map(slug => allArticles.find(a => a.slug === slug))
    .filter(Boolean);

  return (
    <>
      <div className="container">
        {/* Dynamic Category Navigator - Replacing static eras */}
        <section className="era-navigator">
          {config.categories.slice(0, 4).map(cat => (
            <TiltCard key={cat}>
              <Link href={`/articles?category=${encodeURIComponent(cat)}`} className="era-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <span className="era-name">{cat}</span>
                <span className="era-period">Xem thêm</span>
              </Link>
            </TiltCard>
          ))}
        </section>

        {/* Books & Series Section */}
        {Object.keys(seriesGroups).length > 0 && (
          <section className="series-showcase" style={{ marginBottom: 'var(--space-10)' }}>
            <p className="section-label">Series dài kỳ</p>
            <div className="series-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
              {Object.entries(seriesGroups).map(([name, articles]) => (
                <TiltCard key={name}>
                  <div className="series-card admin-card" style={{ padding: 'var(--space-6)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)', marginBottom: 'var(--space-4)' }}>{name}</h3>
                    <div className="series-chapters" style={{ flex: 1 }}>
                      {articles.slice(0, 3).map(a => (
                        <Link key={a.slug} href={`/articles/${a.slug}`} className="series-chapter-link" style={{ display: 'block', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--gold)', marginRight: '8px' }}>Phần {a.seriesOrder}:</span>
                          {a.title}
                        </Link>
                      ))}
                    </div>
                    {articles.length > 3 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 'var(--space-3)' }}>... và {articles.length - 3} phần khác</p>
                    )}
                    <Link href={`/articles/${articles[0].slug}`} className="btn-secondary" style={{ marginTop: 'var(--space-5)', textAlign: 'center', fontSize: '0.9rem' }}>
                      Đọc từ đầu
                    </Link>
                  </div>
                </TiltCard>
              ))}
            </div>
          </section>
        )}

        {/* Main Content Grid */}
        <div className="home-grid">
          {/* Left: Recent Articles with TAGS */}
          <div>
            <p className="section-label">Bài viết mới nhất</p>
            <div className="article-list">
              {recent.map(article => (
                <TiltCard key={article.slug}>
                  <article className="article-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {article.coverImage && (
                      <Link href={`/articles/${article.slug}`}>
                        <div className="article-card-image">
                          <img src={article.coverImage} alt={article.title} />
                        </div>
                      </Link>
                    )}
                    <div className="article-card-meta">
                      <span className="category-badge">{article.category}</span>
                      <span className="article-date">{formatDate(article.date)}</span>
                    </div>
                    <Link href={`/articles/${article.slug}`} className="article-card-title">
                      {article.title}
                    </Link>
                    <p className="article-card-excerpt">{article.excerpt}</p>

                    {/* TAGS DISPLAY */}
                    <div className="home-tags">
                      {article.tags.map(tag => (
                        <span key={tag} className="tag-item">#{tag}</span>
                      ))}
                    </div>

                    <Link href={`/articles/${article.slug}`} className="read-more">
                      Xem chi tiết →
                    </Link>
                  </article>
                </TiltCard>
              ))}
              {recent.length === 0 && (
                <p className="text-muted" style={{ fontStyle: 'italic', padding: 'var(--space-8)' }}>
                  Đang trong quá trình hiệu đính bài viết...
                </p>
              )}
            </div>
          </div>

          {/* Right: Sidebar */}
          <aside className="home-sidebar">
            {/* Stats Row integration into sidebar */}
            <div className="sidebar-section admin-card" style={{ padding: '20px' }}>
              <p className="section-label" style={{ marginBottom: '15px' }}>Kho Lưu Trữ</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>{allArticles.length}</p>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Bài viết</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>{config.categories.length}</p>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Chủ đề</p>
                </div>
              </div>
            </div>

            {/* Simplified Support Area */}
            <div className="sidebar-section admin-card" style={{ padding: '24px', textAlign: 'center' }}>
              <Link href="/contact" className="btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
                Ủng hộ tác giả
              </Link>
            </div>

            {/* Categories */}
            <div className="sidebar-section">
              <p className="section-label">Tủ Sách Chủ Đề</p>
              <div className="category-cloud">
                {config.categories.map(cat => (
                  <Link
                    key={cat}
                    href={`/articles?category=${encodeURIComponent(cat)}`}
                    className="category-pill"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Quote Block */}
        <div className="quote-block">
          <div className="quote-inner">
            <p className="quote-text">{config.quoteBlock.text}</p>
            <p className="quote-author">{config.quoteBlock.author}</p>
          </div>
        </div>
      </div>

      {/* FEATURED AT THE BOTTOM */}
      {featured && (
        <section className="featured-section-bottom">
          <div className="container">
            <p className="section-label" style={{ marginBottom: 'var(--space-6)' }}>Tiêu Điểm Hôm Nay</p>
            <article className="featured-article" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' }}>
              {featured.coverImage && (
                <div className="cover-container" style={{ height: 'auto', minHeight: '400px' }}>
                  <img src={featured.coverImage} className="cover-bg" alt="" aria-hidden="true" />
                  <img src={featured.coverImage} alt={featured.title} className="cover" />
                </div>
              )}
              <div className="featured-article-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-8)' }}>
                <span className="featured-badge">Khuyên đọc</span>
                <p className="featured-category">{featured.category}</p>
                <h2 style={{ fontSize: '2.5rem' }}><Link href={`/articles/${featured.slug}`}>{featured.title}</Link></h2>
                <div className="meta-row">
                  <span>{formatDate(featured.date)}</span>
                  <span className="dot">·</span>
                  <span>{featured.readingTime} phút đọc</span>
                </div>
                <p className="featured-excerpt" style={{ fontSize: '1.1rem' }}>{featured.excerpt}</p>

                <div className="home-tags" style={{ marginBottom: 'var(--space-6)' }}>
                  {featured.tags.map(tag => (
                    <span key={tag} className="tag-item">#{tag}</span>
                  ))}
                </div>

                <Link href={`/articles/${featured.slug}`} className="read-more" style={{ fontSize: '1.1rem' }}>
                  Xem chi tiết →
                </Link>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* Suggested Reading */}
      <div className="container" style={{ padding: 'var(--space-9) 0' }}>
        {suggested.length > 0 && (
          <section>
            <p className="section-label">Có thể bạn quan tâm</p>
            <div className="suggested-grid">
              {suggested.map(article => article && (
                <TiltCard key={article.slug}>
                  <Link href={`/articles/${article.slug}`} className="suggested-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <span className="suggested-category">{article.category}</span>
                    <span className="suggested-title">{article.title}</span>
                    <span className="suggested-date">{formatDate(article.date)}</span>
                  </Link>
                </TiltCard>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
