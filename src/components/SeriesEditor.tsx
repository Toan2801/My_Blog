'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Series } from '@/lib/types';

interface Props {
  series: Series;
}

export default function SeriesEditor({ series }: Props) {
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
    <form onSubmit={handleSubmit}>
      {msg && (
        <div style={{ padding: '12px 16px', background: msg.startsWith('✓') ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: msg.startsWith('✓') ? 'var(--success)' : 'var(--error)' }}>
          {msg}
        </div>
      )}

      <div className="editor-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="editor-main">
          <div className="admin-card">
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
                style={{ minHeight: '200px' }} 
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
                <img src={form.coverImage} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'contain', background: 'var(--parchment, #f5f0e8)', borderRadius: '4px', border: '1px solid var(--border)' }} />
              )}
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label">Loại series</label>
              <select className="sort-select" value={form.type} onChange={e => update('type', e.target.value)}>
                <option value="original">Bài viết</option>
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
        </div>
      </div>
    </form>
  );
}
