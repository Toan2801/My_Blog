'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Series, Article } from '@/lib/types';
import Link from 'next/link';

interface Props {
  series: Series;
  articles: Article[];
}

export default function SeriesEditor({ series, articles }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(series);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const update = (key: string, val: unknown) => {
    setForm(f => ({ ...f, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/series', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMsg('✓ Đã lưu thành công!');
        router.refresh();
      } else {
        const err = await res.json();
        setMsg('Lỗi: ' + err.error);
      }
    } catch {
      setMsg('Lỗi kết nối');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Xác nhận xóa series này? (Các bài viết trong series sẽ không bị xóa nhưng sẽ mất liên kết)')) return;
    const res = await fetch(`/api/series?slug=${form.slug}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/series');
  };

  return (
    <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
      <form onSubmit={handleSubmit} className="editor-main">
        <div className="admin-card">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 'var(--space-4)', color: 'var(--ink)' }}>Thông tin Series</h2>
          {msg && (
            <div style={{ padding: '12px 16px', background: msg.startsWith('✓') ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: msg.startsWith('✓') ? 'var(--success)' : 'var(--error)' }}>
              {msg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tên series *</label>
            <input className="form-input" value={form.title} onChange={e => update('title', e.target.value)} required />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Lời giới thiệu / Mô tả *</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Viết lời giới thiệu cho series..."
              required
              style={{ minHeight: '150px' }}
            />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Ảnh đại diện series</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input className="form-input" value={form.coverImage || ''} onChange={e => update('coverImage', e.target.value)} placeholder="https://..." />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => document.getElementById('series-cover-upload')?.click()}
              >
                Tải lên
              </button>
            </div>
            <input
              id="series-cover-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                if (res.ok) {
                  const data = await res.json();
                  update('coverImage', data.url);
                }
              }}
            />
            {form.coverImage && (
              <img src={form.coverImage} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'contain', background: 'var(--parchment, #f5f0e8)', borderRadius: '4px', border: '1px solid var(--border)' }} />
            )}
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Phân loại</label>
            <input className="form-input" value={form.category || ''} onChange={e => update('category', e.target.value)} placeholder="Ví dụ: Lịch sử Việt Nam" />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Loại series</label>
            <select className="sort-select" value={form.type} onChange={e => update('type', e.target.value)}>
              <option value="articles">Bài viết</option>
              <option value="translation">Bài dịch</option>
            </select>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Trạng thái</label>
            <select className="sort-select" value={form.status} onChange={e => update('status', e.target.value)}>
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
            </select>
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Đang lưu...' : 'Cập nhật series'}
            </button>
            <button type="button" onClick={handleDelete} className="btn-delete">
              Xóa series
            </button>
          </div>
        </div>
      </form>

      <div className="editor-sidebar">
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--ink)' }}>Các bài con</h2>
            <Link href={`/admin/articles/new?series=${encodeURIComponent(series.title)}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
              + Bài mới
            </Link>
          </div>

          <div className="admin-article-list">
            {articles.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontStyle: 'italic', textAlign: 'center', padding: 'var(--space-4) 0' }}>Chưa có bài viết nào trong series này.</p>
            ) : (
              articles.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0)).map((a, idx) => (
                <div key={a.slug} className="admin-article-item" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="admin-article-info" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', width: '20px' }}>{a.seriesOrder || idx + 1}.</span>
                    <div>
                      <p className="admin-article-title" style={{ fontSize: '0.95rem' }}>{a.title}</p>
                      <p className="admin-article-meta" style={{ fontSize: '0.75rem' }}>{a.readingTime} phút đọc · {a.status === 'published' ? 'Đã đăng' : 'Nháp'}</p>
                    </div>
                  </div>
                  <div className="admin-actions">
                    <Link href={`/admin/articles/${a.slug}/edit`} className="btn-edit" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Sửa</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
