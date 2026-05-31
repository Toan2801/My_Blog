'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Article, Series } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import DeleteArticleButton from './DeleteArticleButton';

function getSnippet(content: string, query: string): string | null {
  if (!content || !query) return null;
  // Strip HTML
  const plainText = content.replace(/<[^>]*>/g, ' ');
  const q = query.toLowerCase();
  const idx = plainText.toLowerCase().indexOf(q);
  if (idx === -1) return null;

  const start = Math.max(0, idx - 60);
  const end = Math.min(plainText.length, idx + query.length + 60);
  let snippet = plainText.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < plainText.length) snippet = snippet + '...';
  return snippet;
}

type ListItem = (Article & { isSeries?: false }) | (Series & { isSeries: true });

interface Props {
  items: ListItem[];
  categories: string[];
  initialCategory?: string;
  initialSearch?: string;
}

export default function ArticleListClient({ items, categories, initialCategory, initialSearch }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [searchInput, setSearchInput] = useState(initialSearch || '');
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
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
      setSearchInput(initialSearch);
      setSearchQuery(initialSearch);
    } else {
      setSearchInput('');
      setSearchQuery('');
    }
  }, [initialSearch]);

  const handleCardClick = (e: React.MouseEvent, slug: string, isSeries: boolean) => {
    const target = e.target as HTMLElement;
    // Don't navigate if clicking on edit/delete actions
    if (
      target.closest('.edit-article-btn') || 
      target.closest('.delete-article-btn') || 
      target.closest('button')
    ) {
      return;
    }
    
    const linkPrefix = isSeries ? '/series/' : '/articles/';
    const linkSuffix = !isSeries && searchQuery ? `?highlight=${encodeURIComponent(searchQuery)}` : '';
    router.push(`${linkPrefix}${slug}${linkSuffix}`);
  };

  const totalMatches = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
      const title = item.title.toLowerCase();
      const excerpt = item.isSeries ? item.description.toLowerCase() : item.excerpt.toLowerCase();
      const tags = item.isSeries ? [] : item.tags.map(t => t.toLowerCase());
      const content = !item.isSeries && (item as Article).content ? String((item as Article).content).toLowerCase() : '';
      return title.includes(q) || excerpt.includes(q) || tags.some(t => t.includes(q)) || content.includes(q);
    }).length;
  }, [items, searchQuery]);

  const toggleCat = (cat: string) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filtered = useMemo(() => {
    let res = [...items];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(item => {
        const title = item.title.toLowerCase();
        const excerpt = item.isSeries ? item.description.toLowerCase() : item.excerpt.toLowerCase();
        const tags = item.isSeries ? [] : item.tags.map(t => t.toLowerCase());
        const content = !item.isSeries && (item as Article).content ? String((item as Article).content).toLowerCase() : '';
        return title.includes(q) || excerpt.includes(q) || tags.some(t => t.includes(q)) || content.includes(q);
      });
      // Limit search results to the first 3 items
      res = res.slice(0, 3);
    } else {
      // Hide articles that belong to a series when not searching to keep the list clean
      res = res.filter(item => item.isSeries || !(item as Article).series);
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
  }, [items, searchQuery, selectedCats, sort]);

  return (
    <div className="articles-layout">
      {/* Sidebar Filters */}
      <aside className="sidebar-filters">
        <div className="filter-group">
          <p className="filter-heading">Tìm Kiếm</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="search-input"
              type="search"
              placeholder="Nhập từ khóa..."
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                if (e.target.value === '') {
                  setSearchQuery('');
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setSearchQuery(searchInput);
                }
              }}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button
              onClick={() => setSearchQuery(searchInput)}
              className="btn-primary"
              style={{ padding: '8px 16px', borderRadius: '4px', whiteSpace: 'nowrap', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Tìm
            </button>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: '6px', fontStyle: 'italic' }}>
            * Nhấn Enter hoặc nút Tìm để bắt đầu tìm kiếm
          </p>
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

        {(searchQuery || selectedCats.length > 0) && (
          <button
            onClick={() => { setSearchInput(''); setSearchQuery(''); setSelectedCats([]); }}
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
          {searchQuery ? `Tìm thấy ${totalMatches} kết quả (Hiển thị 3 kết quả phù hợp nhất)` : ''}
          {selectedCats.length > 0 && (searchQuery ? ' · ' : '') + selectedCats.join(', ')}
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
              const category = item.category || (isSeries ? 'Series' : '');
              const date = !isSeries ? formatDate(item.date) : '';
              const readingTime = !isSeries ? `${item.readingTime} phút đọc` : '';
              const excerpt = isSeries ? item.description : item.excerpt;
              const matchSnippet = !isSeries && searchQuery ? getSnippet((item as Article).content || '', searchQuery) : null;

              return (
                <article 
                  key={item.slug} 
                  className={`article-card ${isSeries ? 'series-card-item' : ''}`}
                  onClick={e => handleCardClick(e, item.slug, !!isSeries)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                >
                  <div className="article-card-meta">
                    <span className={`category-badge ${isSeries ? 'series-badge-gold' : ''}`}>
                      {isSeries ? 'SERIES DÀI KỲ' : !isSeries && (item as Article).series ? `${category} · ${(item as Article).series}` : category}
                    </span>
                    {date && <span className="article-date">{date}</span>}
                    {readingTime && <span className="article-reading-time">{readingTime}</span>}
                    {!isSeries && item.featured && <span className="featured-badge">★ Nổi bật</span>}
                  </div>
                  
                  <h3 className="article-card-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                    {item.title}
                  </h3>

                  {item.coverImage && (
                    <div className="article-card-image">
                      <img src={item.coverImage} alt={item.title} loading="lazy" />
                    </div>
                  )}

                  {matchSnippet ? (
                    <div className="search-match-box" style={{ 
                      background: 'var(--parchment-dark, #f4ecd8)', 
                      borderLeft: '4px solid var(--gold, #cda250)',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      fontSize: '0.88rem',
                      color: 'var(--ink)',
                      margin: '12px 0',
                      fontStyle: 'italic',
                      lineHeight: '1.6',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', color: 'var(--gold)', fontWeight: 'bold', marginBottom: '6px', fontStyle: 'normal', letterSpacing: '0.05em' }}>
                        Tìm thấy trong bài viết:
                      </span>
                      {(() => {
                        const q = searchQuery.toLowerCase();
                        const snippetLower = matchSnippet.toLowerCase();
                        const idx = snippetLower.indexOf(q);
                        if (idx === -1) return matchSnippet;
                        
                        const before = matchSnippet.substring(0, idx);
                        const match = matchSnippet.substring(idx, idx + searchQuery.length);
                        const after = matchSnippet.substring(idx + searchQuery.length);
                        
                        return (
                          <>
                            {before}
                            <mark style={{ backgroundColor: '#fdf3cd', color: '#856404', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
                              {match}
                            </mark>
                            {after}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="article-card-excerpt">
                      {excerpt.length > 200 ? excerpt.substring(0, 200) + '...' : excerpt}
                    </p>
                  )}

                  {/* Bottom Row - Admin Controls only */}
                  {!isSeries && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: 'var(--space-3)', width: '100%' }}>
                      {isAdmin ? (
                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                          <Link 
                            href={`/admin/articles/${item.slug}/edit`} 
                            className="edit-article-btn" 
                            title="Sửa bài viết"
                            onClick={e => e.stopPropagation()}
                          >
                            ✏️ Sửa bài
                          </Link>
                          <div onClick={e => e.stopPropagation()}>
                            <DeleteArticleButton slug={item.slug} />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                          <button 
                            className="edit-article-btn disabled" 
                            disabled 
                            title="Bạn cần đăng nhập với quyền Admin để sửa bài viết"
                            onClick={e => e.stopPropagation()}
                          >
                            ✏️ Sửa bài
                          </button>
                          <button 
                            className="delete-article-btn disabled" 
                            disabled 
                            title="Bạn cần đăng nhập với quyền Admin để xóa bài viết"
                            onClick={e => e.stopPropagation()}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
