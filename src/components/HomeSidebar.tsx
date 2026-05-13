import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface RecentArticle {
  slug: string;
  title: string;
  date: string;
}

interface Props {
  recentArticles: RecentArticle[];
  categories: string[];
  quoteBlock?: { text: string; author: string };
}

export default function HomeSidebar({ recentArticles, categories, quoteBlock }: Props) {
  return (
    <aside className="home-sidebar">
      {/* Recent articles */}
      <div className="sidebar-section">
        <p className="section-label">Mới nhất</p>
        <ul className="recent-list">
          {recentArticles.map(a => (
            <li key={a.slug} className="recent-item">
              <Link href={`/articles/${a.slug}`}>
                <span className="recent-item-title">{a.title}</span>
                <span className="recent-item-date">{formatDate(a.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Categories */}
      <div className="sidebar-section">
        <p className="section-label">Chủ đề</p>
        <div className="category-cloud">
          {categories.map(cat => (
            <Link key={cat} href={`/articles?category=${encodeURIComponent(cat)}`} className="category-pill">
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Quote block */}
      {quoteBlock && (
        <div className="sidebar-section">
          <div className="quote-block" style={{ border: 'none', padding: 0, margin: 0 }}>
            <div className="quote-inner" style={{ textAlign: 'left' }}>
              <p className="quote-text" style={{ fontSize: '1rem' }}>{quoteBlock.text}</p>
              <p className="quote-author">{quoteBlock.author}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
