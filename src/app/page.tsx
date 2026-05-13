import Link from 'next/link';
import { getSiteConfig, getAllArticles, getAllSeries } from '@/lib/data';
import { getVideos } from '@/lib/video-data';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trang Chủ',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return formatDate(dateStr);
}

export default function HomePage() {
  const config = getSiteConfig();
  const allArticles = getAllArticles();
  const allSeries = getAllSeries();
  const videos = getVideos();

  // Published content
  const published = allArticles.filter(a => a.status === 'published');
  const regularArticles = published.filter(a => !a.series);

  // Featured series
  const featuredSeriesArticles = allSeries.filter(s => s.featured && s.type === 'articles' && s.status === 'published');
  const featuredSeriesTranslations = allSeries.filter(s => s.featured && s.type === 'translation' && s.status === 'published');

  // Featured standalone
  const featuredOriginals = regularArticles.filter(a => a.type === 'articles' && a.featured).slice(0, Math.max(0, 6 - featuredSeriesArticles.length));
  const featuredTranslations = regularArticles.filter(a => a.type === 'translation' && a.featured).slice(0, Math.max(0, 6 - featuredSeriesTranslations.length));

  // Recent articles for "Latest" section
  const recentArticles = published
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  // Categories from config
  const categories = ['Tất cả', ...config.categories];

  return (
    <>
      {/* Info Banner */}
      <div className="dc-banner">
        <svg className="dc-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span className="dc-banner-text">
          Chào mừng đến <strong>{config.blogTitle}</strong>! Khám phá các bài viết và bài dịch về lịch sử.
        </span>
      </div>

      {/* Filter chips */}
      <div className="dc-filters">
        {categories.map((cat, i) => (
          <Link
            key={cat}
            href={cat === 'Tất cả' ? '/articles' : `/articles?category=${encodeURIComponent(cat)}`}
            className={`dc-chip${i === 0 ? ' active' : ''}`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Featured Articles */}
      {(featuredSeriesArticles.length > 0 || featuredOriginals.length > 0) && (
        <>
          <h2 className="dc-section-header">Bài viết nổi bật</h2>
          <div className="dc-post-grid" style={{ marginBottom: 32 }}>
            {featuredSeriesArticles.map(series => (
              <Link key={series.slug} href={`/series/${series.slug}`} className="dc-post-card">
                <div className="dc-post-card-meta-top">
                  <span className="dc-post-category">Series</span>
                </div>
                {series.coverImage && (
                  <div className="dc-post-thumb">
                    <img src={series.coverImage} alt={series.title} />
                  </div>
                )}
                <div className="dc-post-body">
                  <h3 className="dc-post-title">{series.title}</h3>
                  <p className="dc-post-excerpt">
                    {series.description.length > 100 ? series.description.substring(0, 100) + '...' : series.description}
                  </p>
                </div>
                <div className="dc-post-footer">
                  <span className="dc-post-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                    Series
                  </span>
                </div>
              </Link>
            ))}
            {featuredOriginals.map(article => (
              <Link key={article.slug} href={`/articles/${article.slug}`} className="dc-post-card">
                <div className="dc-post-card-meta-top">
                  <span className="dc-post-category">{article.category || 'Bài viết'}</span>
                  <span className="dc-post-time">{timeAgo(article.date)}</span>
                </div>
                {article.coverImage && (
                  <div className="dc-post-thumb">
                    <img src={article.coverImage} alt={article.title} />
                  </div>
                )}
                <div className="dc-post-body">
                  <h3 className="dc-post-title">{article.title}</h3>
                  <p className="dc-post-excerpt">
                    {article.excerpt.length > 100 ? article.excerpt.substring(0, 100) + '...' : article.excerpt}
                  </p>
                  {article.tags.length > 0 && (
                    <div className="dc-post-tags">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="dc-post-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dc-post-footer">
                  <span className="dc-post-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {article.readingTime} phút
                  </span>
                  <span className="dc-post-author-avatar">
                    {(article.author || config.authorName).slice(0, 1).toUpperCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Featured Translations */}
      {(featuredSeriesTranslations.length > 0 || featuredTranslations.length > 0) && (
        <>
          <h2 className="dc-section-header">Bài dịch nổi bật</h2>
          <div className="dc-post-grid" style={{ marginBottom: 32 }}>
            {featuredSeriesTranslations.map(series => (
              <Link key={series.slug} href={`/series/${series.slug}`} className="dc-post-card">
                <div className="dc-post-card-meta-top">
                  <span className="dc-post-category">Series</span>
                </div>
                {series.coverImage && (
                  <div className="dc-post-thumb">
                    <img src={series.coverImage} alt={series.title} />
                  </div>
                )}
                <div className="dc-post-body">
                  <h3 className="dc-post-title">{series.title}</h3>
                  <p className="dc-post-excerpt">
                    {series.description.length > 100 ? series.description.substring(0, 100) + '...' : series.description}
                  </p>
                </div>
                <div className="dc-post-footer">
                  <span className="dc-post-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                    Series
                  </span>
                </div>
              </Link>
            ))}
            {featuredTranslations.map(article => (
              <Link key={article.slug} href={`/articles/${article.slug}`} className="dc-post-card">
                <div className="dc-post-card-meta-top">
                  <span className="dc-post-category">{article.category || 'Bài dịch'}</span>
                  <span className="dc-post-time">{timeAgo(article.date)}</span>
                </div>
                {article.coverImage && (
                  <div className="dc-post-thumb">
                    <img src={article.coverImage} alt={article.title} />
                  </div>
                )}
                <div className="dc-post-body">
                  <h3 className="dc-post-title">{article.title}</h3>
                  <p className="dc-post-excerpt">
                    {article.excerpt.length > 100 ? article.excerpt.substring(0, 100) + '...' : article.excerpt}
                  </p>
                  {article.tags.length > 0 && (
                    <div className="dc-post-tags">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="dc-post-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dc-post-footer">
                  <span className="dc-post-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {article.readingTime} phút
                  </span>
                  <span className="dc-post-author-avatar">
                    {(article.author || config.authorName).slice(0, 1).toUpperCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Recent / Latest Posts */}
      <h2 className="dc-section-header">Bài viết mới nhất</h2>
      <div className="dc-post-grid" style={{ marginBottom: 32 }}>
        {recentArticles.map(article => (
          <Link key={article.slug} href={`/articles/${article.slug}`} className="dc-post-card">
            <div className="dc-post-card-meta-top">
              <span className="dc-post-category">{article.category || article.type === 'translation' ? 'Bài dịch' : 'Bài viết'}</span>
              <span className="dc-post-time">{timeAgo(article.date)}</span>
            </div>
            {article.coverImage && (
              <div className="dc-post-thumb">
                <img src={article.coverImage} alt={article.title} />
              </div>
            )}
            <div className="dc-post-body">
              <h3 className="dc-post-title">{article.title}</h3>
              <p className="dc-post-excerpt">
                {article.excerpt.length > 100 ? article.excerpt.substring(0, 100) + '...' : article.excerpt}
              </p>
              {article.tags.length > 0 && (
                <div className="dc-post-tags">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="dc-post-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="dc-post-footer">
              <span className="dc-post-stat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {article.readingTime} phút
              </span>
              <span className="dc-post-author-avatar">
                {(article.author || config.authorName).slice(0, 1).toUpperCase()}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Videos Section */}
      {videos.length > 0 && (
        <>
          <h2 className="dc-section-header">Video</h2>
          <div className="dc-video-grid">
            {videos.slice(0, 4).map(v => (
              <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="dc-video-card">
                <p className="dc-video-card-title">{v.title}</p>
                {v.description && <p className="dc-video-card-desc">{v.description.substring(0, 80)}</p>}
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}
