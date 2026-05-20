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
      <div className="flex items-center gap-3 max-md:flex-col max-md:items-stretch">
        <label className="flex h-11 flex-1 items-center gap-2.5 rounded-full bg-surface px-5 transition focus-within:bg-base [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
          <input
            className="flex-1 border-0 bg-transparent text-sm text-normal outline-none placeholder:text-muted"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm kiếm hoặc tạo bài đăng…"
          />
        </label>
        <Link
          href="/admin/articles/new"
          className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-themed px-5 text-sm font-semibold text-white no-underline transition hover:shadow-md hover:brightness-80 max-md:justify-center [&_svg]:size-4"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Bài đăng mới
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          className="inline-flex self-start items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm text-subtle transition-colors hover:bg-hover [&_svg]:size-4"
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
          <div className="absolute left-0 top-[110%] z-20 min-w-[180px] rounded-xl border border-normal bg-base p-1.5 shadow-md">
            {(['recent', 'title', 'status'] as SortMode[]).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { setSort(opt); setSortOpen(false); }}
                className={`block w-full cursor-pointer rounded-md border-0 px-3 py-2 text-left text-[0.84rem] ${
                  sort === opt
                    ? 'bg-hover font-semibold text-themed'
                    : 'bg-transparent font-medium text-normal'
                }`}
              >
                {opt === 'recent' ? 'Mới nhất' : opt === 'title' ? 'Theo tên' : 'Theo trạng thái'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted">
            {q ? 'Không tìm thấy bài đăng phù hợp.' : (
              <>Chưa có bài đăng nào. <Link href="/admin/articles/new" className="text-themed">Tạo bài đầu tiên →</Link></>
            )}
          </div>
        ) : (
          filtered.map(a => (
            <Link
              key={a.slug}
              href={`/admin/articles/${a.slug}/edit`}
              className="block rounded-xl border border-normal bg-base px-5 py-3.5 text-inherit no-underline transition hover:shadow-md"
            >
              <p className="mb-1 text-base font-bold text-normal">{a.title}</p>
              <p className="mb-2 line-clamp-1 text-sm leading-6 text-subtle">{snippet(a.excerpt)}</p>
              <div className="flex items-center gap-2.5 text-xs text-muted">
                <span
                  className={a.status === 'published'
                    ? 'rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-success'
                    : 'rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-themed'}
                >
                  {a.status === 'published' ? 'Đã đăng' : 'Nháp'}
                </span>
                <span>•</span>
                <span>{relativeTime(a.date)}</span>
                {a.category && (
                  <>
                    <span>•</span>
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
