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
              const isSeries = item.isSeries;
              const linkPrefix = isSeries ? '/series/' : '/articles/';
              const category = item.category || (isSeries ? 'Series' : '');
              const date = !isSeries ? formatDate(item.date) : '';
              const readingTime = !isSeries ? `${item.readingTime} phút đọc` : '';
              const excerpt = isSeries ? item.description : item.excerpt;

              return (
                <article key={item.slug} className={`article-card ${isSeries ? 'series-card-item' : ''}`}>
                  <div className="article-card-meta">
                    <span className={`category-badge ${isSeries ? 'series-badge-gold' : ''}`}>
                      {isSeries ? 'SERIES DÀI KỲ' : category}
                    </span>
                    {date && <span className="article-date">{date}</span>}
                    {readingTime && <span className="article-reading-time">{readingTime}</span>}
                    {!isSeries && item.featured && <span className="featured-badge">★ Nổi bật</span>}
                  </div>
                  
                  <Link href={`${linkPrefix}${item.slug}`} className="article-card-title">
                    {item.title}
                  </Link>

                  {item.coverImage && (
                    <Link href={`${linkPrefix}${item.slug}`}>
                      <div className="article-card-image">
                        <img src={item.coverImage} alt={item.title} loading="lazy" />
                      </div>
                    </Link>
                  )}

                  <p className="article-card-excerpt">
                    {excerpt.length > 200 ? excerpt.substring(0, 200) + '...' : excerpt}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                    <Link href={`${linkPrefix}${item.slug}`} className="read-more">
                      {isSeries ? 'Xem trọn bộ →' : 'Đọc tiếp →'}
                    </Link>
                    {!isSeries && item.pages && item.pages.length > 0 && (
                      <Link href={`/read/${item.slug}`} className="read-more" style={{ color: 'var(--ink)', background: 'var(--parchment-dark, #e8e2d8)', padding: '2px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        📖 Đọc sách
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
