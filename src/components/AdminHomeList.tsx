'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Article } from '@/lib/types';

type SortMode = 'recent' | 'title' | 'status';

interface Props {
  articles: Article[];
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const day = 86400000;
  const days = Math.floor(diffMs / day);
  if (days < 1) return 'hôm nay';
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
}

function snippet(excerpt: string, max = 220): string {
  const text = excerpt.replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export default function AdminHomeList({ articles }: Props) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? articles.filter(
          a =>
            a.title.toLowerCase().includes(needle) ||
            a.excerpt.toLowerCase().includes(needle) ||
            (a.category || '').toLowerCase().includes(needle),
        )
      : articles.slice();

    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'status') list.sort((a, b) => a.status.localeCompare(b.status) || b.date.localeCompare(a.date));
    else list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [articles, q, sort]);

  const sortLabel = sort === 'title' ? 'Theo tên' : sort === 'status' ? 'Theo trạng thái' : 'Mới nhất';

  return (
    <>
      <div className="dc-admin-topbar">
        <label className="dc-admin-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm kiếm hoặc tạo bài đăng…"
          />
        </label>
        <Link href="/admin/articles/new" className="dc-admin-new-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Bài đăng mới
        </Link>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="dc-admin-sort"
          onClick={() => setSortOpen(o => !o)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="6" y1="12" x2="18" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          Sắp xếp &amp; Hiển thị: {sortLabel}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {sortOpen && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              zIndex: 20,
              background: 'var(--dc-bg-surface)',
              border: '1px solid var(--dc-border)',
              borderRadius: 'var(--dc-radius-md)',
              boxShadow: 'var(--dc-shadow-md)',
              padding: 6,
              minWidth: 180,
            }}
          >
            {(['recent', 'title', 'status'] as SortMode[]).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { setSort(opt); setSortOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  border: 'none',
                  background: sort === opt ? 'var(--dc-accent-light)' : 'transparent',
                  color: sort === opt ? 'var(--dc-accent)' : 'var(--dc-text-primary)',
                  fontFamily: 'var(--dc-font)',
                  fontSize: '0.84rem',
                  fontWeight: sort === opt ? 600 : 500,
                  borderRadius: 'var(--dc-radius-sm)',
                  cursor: 'pointer',
                }}
              >
                {opt === 'recent' ? 'Mới nhất' : opt === 'title' ? 'Theo tên' : 'Theo trạng thái'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="dc-admin-list">
        {filtered.length === 0 ? (
          <div className="dc-admin-empty">
            {q ? 'Không tìm thấy bài đăng phù hợp.' : (
              <>Chưa có bài đăng nào. <Link href="/admin/articles/new" style={{ color: 'var(--dc-accent)' }}>Tạo bài đầu tiên →</Link></>
            )}
          </div>
        ) : (
          filtered.map(a => (
            <Link key={a.slug} href={`/admin/articles/${a.slug}/edit`} className="dc-admin-post">
              <p className="dc-admin-post-title">{a.title}</p>
              <p className="dc-admin-post-snippet">{snippet(a.excerpt)}</p>
              <div className="dc-admin-post-meta">
                <span className={`dc-admin-status-chip ${a.status}`}>
                  {a.status === 'published' ? 'Đã đăng' : 'Nháp'}
                </span>
                <span className="sep">•</span>
                <span>{relativeTime(a.date)}</span>
                {a.category && (
                  <>
                    <span className="sep">•</span>
                    <span>{a.category}</span>
                  </>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
