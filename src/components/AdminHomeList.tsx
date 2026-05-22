'use client';

import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
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
        <label className="flex h-11 flex-1 items-center gap-2.5 rounded-full bg-muted px-5 transition focus-within:bg-normal [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-600 dark:[&_svg]:text-neutral-400">
          <MagnifyingGlassIcon />
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
          <PencilSquareIcon />
          Bài đăng mới
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          className="inline-flex self-start items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-sm text-subtle transition-colors hover:bg-hover [&_svg]:size-4"
          onClick={() => setSortOpen(o => !o)}
        >
          <AdjustmentsHorizontalIcon />
          Sắp xếp &amp; Hiển thị: {sortLabel}
          <ChevronDownIcon />
        </button>
        {sortOpen && (
          <div className="absolute left-0 top-[110%] z-20 min-w-[180px] rounded-xl border border-normal bg-normal p-1.5 shadow-md">
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
              className="block rounded-xl border border-normal bg-normal px-5 py-3.5 text-inherit no-underline transition hover:shadow-md"
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
