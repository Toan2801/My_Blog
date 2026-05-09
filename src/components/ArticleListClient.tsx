'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Article, Series } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type ListItem = (Article & { isSeries?: false }) | (Series & { isSeries: true });

interface Props {
  items: ListItem[];
  categories: string[];
  initialCategory?: string;
  initialSearch?: string;
}

export default function ArticleListClient({ items, categories, initialCategory, initialSearch }: Props) {
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedCats, setSelectedCats] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [sort, setSort] = useState('newest');

  // Sync state with props when navigation happens
  useEffect(() => {
    if (initialCategory) {
      setSelectedCats([initialCategory]);
    } else {
      setSelectedCats([]);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const toggleCat = (cat: string) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filtered = useMemo(() => {
    let res = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(item => {
        const title = item.title.toLowerCase();
        const excerpt = item.isSeries ? item.description.toLowerCase() : item.excerpt.toLowerCase();
        const tags = item.isSeries ? [] : item.tags.map(t => t.toLowerCase());
        return title.includes(q) || excerpt.includes(q) || tags.some(t => t.includes(q));
      });
    }
    if (selectedCats.length > 0) {
      res = res.filter(item => {
        if (item.isSeries) return true; // Show series always or handle category for series?
        return selectedCats.includes(item.category || '');
      });
    }
    
    res.sort((a, b) => {
      const dateA = a.isSeries ? 0 : new Date(a.date).getTime();
      const dateB = b.isSeries ? 0 : new Date(b.date).getTime();
      
      if (sort === 'newest') return dateB - dateA;
      if (sort === 'oldest') return dateA - dateB;
      if (sort === 'featured') {
        const featA = a.isSeries ? 1 : Number(a.featured);
        const featB = b.isSeries ? 1 : Number(b.featured);
        return featB - featA;
      }
      return 0;
    });
    return res;
  }, [items, search, selectedCats, sort]);

  return (
    <div className="articles-layout">
      {/* Sidebar Filters */}
      <aside className="sidebar-filters">
        <div className="filter-group">
          <p className="filter-heading">Tìm Kiếm</p>
          <input
            className="search-input"
            type="search"
            placeholder="Tiêu đề, từ khóa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <p className="filter-heading">Chủ Đề</p>
          <div className="filter-checkbox">
            {categories.map(cat => (
              <label key={cat} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedCats.includes(cat)}
                  onChange={() => toggleCat(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <p className="filter-heading">Sắp Xếp</p>
          <select
            className="sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="featured">Nổi bật</option>
          </select>
        </div>

        {(search || selectedCats.length > 0) && (
          <button
            onClick={() => { setSearch(''); setSelectedCats([]); }}
            className="btn-secondary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            Xóa bộ lọc
          </button>
        )}
      </aside>

      {/* Article List */}
      <div>
        <p className="text-ui text-muted" style={{ fontSize: '0.82rem', marginBottom: 'var(--space-4)' }}>
          {search ? `Tìm kiếm "${search}"` : ''}
          {selectedCats.length > 0 && (search ? ' · ' : '') + selectedCats.join(', ')}
        </p>

        {filtered.length === 0 ? (
          <div className="no-results">
            <p>Không tìm thấy nội dung nào.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="article-list">
            {filtered.map(item => {
              if (item.isSeries) {
                return (
                  <article key={item.slug} className="article-card series-card-item" style={{ borderLeft: '4px solid var(--gold)' }}>
                    <div className="article-card-meta">
                      <span className="series-badge" style={{ background: 'var(--gold)', color: 'white' }}>SERIES DÀI KỲ</span>
                    </div>
                    <Link href={`/series/${item.slug}`} className="article-card-title">
                      {item.title}
                    </Link>
                    {item.coverImage && (
                      <Link href={`/series/${item.slug}`}>
                        <div className="article-card-image" style={{ height: '200px' }}>
                          <img src={item.coverImage} alt={item.title} style={{ objectFit: 'cover', height: '100%', width: '100%' }} />
                        </div>
                      </Link>
                    )}
                    <p className="article-card-excerpt">{item.description}</p>
                    <Link href={`/series/${item.slug}`} className="read-more" style={{ display: 'inline-block', marginTop: 'var(--space-2)' }}>
                      Xem trọn bộ →
                    </Link>
                  </article>
                );
              }

              const article = item;
              return (
                <article key={article.slug} className="article-card">
                  <div className="article-card-meta">
                    {article.category && <span className="category-badge">{article.category}</span>}
                    <span className="article-date">{formatDate(article.date)}</span>
                    <span className="article-reading-time">{article.readingTime} phút đọc</span>
                    {article.featured && <span className="series-badge">★ Nổi bật</span>}
                  </div>
                  <Link href={`/articles/${article.slug}`} className="article-card-title">
                    {article.title}
                  </Link>
                  {article.coverImage && (
                    <Link href={`/articles/${article.slug}`}>
                      <div className="article-card-image">
                        <img src={article.coverImage} alt={article.title} />
                      </div>
                    </Link>
                  )}
                  <p className="article-card-excerpt">{article.excerpt}</p>
                  {article.tags.length > 0 && (
                    <div className="article-tags">
                      {article.tags.map(tag => (
                        <span key={tag} className="tag-chip">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <Link href={`/articles/${article.slug}`} className="read-more" style={{ display: 'inline-block', marginTop: 'var(--space-2)' }}>
                    Đọc tiếp →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
