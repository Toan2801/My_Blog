import Link from 'next/link';
import {
  getPublicArticleSummaries,
  getPublicSiteConfig,
} from '@/lib/public-data';
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
  if (days < 30) return `${days} ngày trước`;
  return formatDate(dateStr);
}

export default async function HomePage() {
  const [config, allArticles] = await Promise.all([
    getPublicSiteConfig(),
    getPublicArticleSummaries(),
  ]);

  const published = allArticles
    .filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featured = published.find(a => a.featured) || published[0];
  const older = published.filter(a => a.slug !== featured?.slug);

  return (
    <div className="dc-home-shell">
      {featured && (
        <Link href={`/articles/${featured.slug}`} className="dc-home-featured">
          <div className="dc-home-featured-thumb">
            {featured.coverImage ? (
              <img src={featured.coverImage} alt={featured.title} />
            ) : null}
          </div>
          <div className="dc-home-featured-body">
            <div className="dc-home-featured-meta">
              <span className="dc-home-featured-author">
                {featured.author || config.authorName}
              </span>
              <span className="dc-home-featured-date">· {timeAgo(featured.date)}</span>
              <span className="dc-home-featured-pin">Nổi bật</span>
            </div>
            <h2 className="dc-home-featured-title">{featured.title}</h2>
            {featured.excerpt && (
              <p className="dc-home-featured-excerpt">{featured.excerpt}</p>
            )}
          </div>
        </Link>
      )}

      <div className="dc-home-divider">Bài đăng cũ hơn</div>

      <div className="dc-home-grid">
        {older.map(article => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="dc-home-card"
          >
            <div className="dc-home-card-header">
              <span className="dc-home-card-author">
                {article.author || config.authorName}
              </span>
              <span className="dc-home-card-date">· {timeAgo(article.date)}</span>
            </div>
            <h3 className="dc-home-card-title">{article.title}</h3>
            <div className="dc-home-card-thumb">
              {article.coverImage ? (
                <img src={article.coverImage} alt={article.title} />
              ) : (
                <div className="dc-home-card-thumb-empty">Không có ảnh bìa</div>
              )}
              {article.tags.length > 0 && (
                <div className="dc-home-card-tags">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="dc-home-card-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="dc-home-card-actions">
              <span className="dc-home-card-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Bình luận
              </span>
              <span className="dc-home-card-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Lưu
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
