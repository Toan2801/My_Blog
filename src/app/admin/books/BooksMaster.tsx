'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface BookRow {
  slug: string;
  title: string;
  author: string;
  category: string;
  status: 'draft' | 'published';
  updatedAt: string | null;
  rasterizedAt: string | null;
  isRasterized: boolean;
}

interface Props {
  initial: BookRow[];
}

export default function BooksMaster({ initial }: Props) {
  const router = useRouter();
  const [books, setBooks] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<{ kind: 'idle' | 'one' | 'batch'; slug?: string }>({ kind: 'idle' });
  const [log, setLog] = useState<Array<{ slug: string; ok: boolean; error?: string }>>([]);

  const unrasterizedSlugs = useMemo(
    () => books.filter((b) => !b.isRasterized).map((b) => b.slug),
    [books],
  );

  const toggle = (slug: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const toggleAllUnrasterized = () => {
    setSelected((s) => {
      const all = unrasterizedSlugs;
      if (all.every((slug) => s.has(slug))) {
        const next = new Set(s);
        all.forEach((slug) => next.delete(slug));
        return next;
      }
      return new Set([...s, ...all]);
    });
  };

  const rasterizeOne = async (slug: string) => {
    setBusy({ kind: 'one', slug });
    setLog([]);
    const res = await fetch(`/api/admin/articles/${slug}/rasterize`, { method: 'POST' });
    const data = res.ok ? await res.json() : { error: 'failed' };
    setBusy({ kind: 'idle' });
    if (res.ok) {
      setBooks((bs) =>
        bs.map((b) => (b.slug === slug ? { ...b, rasterizedAt: data.rasterizedAt, isRasterized: true } : b)),
      );
      router.refresh();
    } else {
      setLog([{ slug, ok: false, error: data.error || 'failed' }]);
    }
  };

  const rasterizeBatch = async () => {
    const slugs = Array.from(selected);
    if (slugs.length === 0) return;
    setBusy({ kind: 'batch' });
    setLog([]);
    const res = await fetch('/api/admin/articles/batch-rasterize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs }),
    });
    const data = res.ok ? await res.json() : { results: [] };
    setBusy({ kind: 'idle' });
    setLog(data.results || []);
    const okSlugs = new Set<string>((data.results || []).filter((r: { ok: boolean }) => r.ok).map((r: { slug: string }) => r.slug));
    setBooks((bs) =>
      bs.map((b) =>
        okSlugs.has(b.slug)
          ? { ...b, isRasterized: true, rasterizedAt: new Date().toISOString() }
          : b,
      ),
    );
    setSelected(new Set());
    router.refresh();
  };

  const deleteOne = async (slug: string) => {
    if (!confirm(`Xoá sách "${slug}"? Hành động này không thể hoàn tác.`)) return;
    const res = await fetch(`/api/articles?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (res.ok) {
      setBooks((bs) => bs.filter((b) => b.slug !== slug));
      router.refresh();
    } else {
      alert('Xoá thất bại.');
    }
  };

  const isBusy = busy.kind !== 'idle';

  return (
    <div className="admin-card books-master">
      <div className="books-toolbar">
        <label className="books-select-all">
          <input
            type="checkbox"
            checked={unrasterizedSlugs.length > 0 && unrasterizedSlugs.every((s) => selected.has(s))}
            onChange={toggleAllUnrasterized}
            disabled={unrasterizedSlugs.length === 0}
          />
          Chọn tất cả "Unrasterized" ({unrasterizedSlugs.length})
        </label>
        <button
          type="button"
          className="btn-primary"
          disabled={selected.size === 0 || isBusy}
          onClick={rasterizeBatch}
        >
          {busy.kind === 'batch' ? `Đang rasterize ${selected.size} sách…` : `🛠 Batch Rasterize (${selected.size})`}
        </button>
      </div>

      <table className="books-table">
        <thead>
          <tr>
            <th></th>
            <th>Tiêu đề</th>
            <th>Tác giả</th>
            <th>Trạng thái</th>
            <th>Rasterize</th>
            <th>Cập nhật</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => {
            const checked = selected.has(b.slug);
            const oneBusy = busy.kind === 'one' && busy.slug === b.slug;
            return (
              <tr key={b.slug} className={b.isRasterized ? '' : 'is-unrasterized'}>
                <td>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(b.slug)}
                    disabled={isBusy}
                  />
                </td>
                <td>
                  <Link href={`/admin/articles/${b.slug}/edit`} className="books-title-link">
                    {b.title}
                  </Link>
                  <div className="books-cat">{b.category}</div>
                </td>
                <td>{b.author}</td>
                <td>
                  <span className={`status-badge status-${b.status}`}>
                    {b.status === 'published' ? 'Đã đăng' : 'Nháp'}
                  </span>
                </td>
                <td>
                  <span className={`rast-badge ${b.isRasterized ? 'rast-ok' : 'rast-no'}`}>
                    {b.isRasterized ? 'Rasterized' : 'Unrasterized'}
                  </span>
                  {b.rasterizedAt && (
                    <div className="rast-time" title={b.rasterizedAt}>
                      {new Date(b.rasterizedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                </td>
                <td>{b.updatedAt ? new Date(b.updatedAt).toLocaleString('vi-VN') : '—'}</td>
                <td>
                  <div className="books-actions">
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => rasterizeOne(b.slug)}
                      disabled={isBusy}
                    >
                      {oneBusy ? '…' : 'Rasterize'}
                    </button>
                    <Link href={`/admin/articles/${b.slug}/edit`} className="btn-edit">Sửa</Link>
                    <button
                      type="button"
                      className="btn-edit btn-danger"
                      onClick={() => deleteOne(b.slug)}
                      disabled={isBusy}
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {books.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-muted)' }}>Chưa có sách nào.</td></tr>
          )}
        </tbody>
      </table>

      {log.length > 0 && (
        <div className="books-log">
          <h3>Kết quả batch:</h3>
          <ul>
            {log.map((r) => (
              <li key={r.slug} className={r.ok ? 'log-ok' : 'log-err'}>
                {r.ok ? '✓' : '✗'} {r.slug} {r.error ? `— ${r.error}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
