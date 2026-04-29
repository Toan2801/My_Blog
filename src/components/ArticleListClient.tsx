'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface Props {
  articles: Article[];
  categories: string[];
  initialCategory?: string;
  initialSearch?: string;
}

export default function ArticleListClient({ articles, categories, initialCategory, initialSearch }: Props) {
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
    let res = [...articles];
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedCats.length > 0) {
      res = res.filter(a => selectedCats.includes(a.category));
    }
    if (sort === 'newest') res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sort === 'oldest') res.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sort === 'featured') res.sort((a, b) => Number(b.featured) - Number(a.featured));
    return res;
  }, [articles, search, selectedCats, sort]);

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
          {filtered.length} bài viết
          {search && ` · tìm kiếm "${search}"`}
          {selectedCats.length > 0 && ` · ${selectedCats.join(', ')}`}
        </p>

        {filtered.length === 0 ? (
          <div className="no-results">
            <p>Không tìm thấy bài viết nào.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="article-list">
            {filtered.map(article => (
              <article key={article.slug} className="article-card">
                <div className="article-card-meta">
                  <span className="category-badge">{article.category}</span>
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
                {article.subtitle && (
                  <p style={{ fontStyle: 'italic', color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '-8px' }}>
                    {article.subtitle}
                  </p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
