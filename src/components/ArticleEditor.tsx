'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Article, Footnote, Series } from '@/lib/types';
import dynamic from 'next/dynamic';
import { RichTextEditorRef } from './RichTextEditor';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '500px', background: '#f8f9fa', border: '1px solid #c8ccd1', borderRadius: '4px' }} />
});

interface Props {
  initialArticle?: Partial<Article>;
  categories: string[];
  seriesList: Series[];
  isEdit?: boolean;
}

export default function ArticleEditor({ initialArticle, categories, seriesList, isEdit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seriesFromUrl = searchParams.get('series');
  
  const editorRef = useRef<RichTextEditorRef>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    title: initialArticle?.title || '',
    subtitle: initialArticle?.subtitle || '',
    excerpt: initialArticle?.excerpt || '',
    content: initialArticle?.content || '',
    category: initialArticle?.category || categories[0] || '',
    type: initialArticle?.type || 'articles' as 'articles' | 'translation',
    tags: initialArticle?.tags || [] as string[],
    series: initialArticle?.series || seriesFromUrl || '',
    seriesOrder: initialArticle?.seriesOrder?.toString() || '',
    featured: initialArticle?.featured || false,
    status: initialArticle?.status || 'draft' as 'draft' | 'published',
    date: initialArticle?.date || new Date().toISOString().split('T')[0],
    readingTime: initialArticle?.readingTime?.toString() || '5',
    slug: initialArticle?.slug || '',
    coverImage: initialArticle?.coverImage || '',
    author: initialArticle?.author || '',
    footnotes: initialArticle?.footnotes || [] as Footnote[],
  });

  // Automatically sync with series settings
  useEffect(() => {
    if (form.series) {
      const seriesObj = seriesList.find(s => s.title === form.series);
      if (seriesObj) {
        setForm(f => ({
          ...f,
          category: seriesObj.category || f.category,
          type: seriesObj.type || f.type
        }));
      }
    }
  }, [form.series, seriesList]);

  const handleAddFootnote = () => {
    const nextNum = form.footnotes.length + 1;
    const newFootnote: Footnote = {
      id: Date.now().toString(),
      num: nextNum,
      content: ''
    };

    setForm(f => ({
      ...f,
      footnotes: [...f.footnotes, newFootnote]
    }));

    // Trigger editor to insert marker
    editorRef.current?.insertFootnote(nextNum);
  };

  const updateFootnote = (id: string, content: string) => {
    setForm(f => ({
      ...f,
      footnotes: f.footnotes.map(fn => fn.id === id ? { ...fn, content } : fn)
    }));
  };

  const removeFootnote = (id: string) => {
    setForm(f => ({
      ...f,
      footnotes: f.footnotes.filter(fn => fn.id !== id)
    }));
  };

  const [tagInput, setTagInput] = useState('');

  const update = (key: string, val: unknown) => {
    setForm(f => {
      const next = { ...f, [key]: val };

      // Auto-calculate reading time when content changes
      if (key === 'content' && typeof val === 'string') {
        const text = val.replace(/<[^>]*>/g, ''); // strip html
        const wordCount = text.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        next.readingTime = minutes.toString();
      }

      return next;
    });
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().replace(/,$/, '');
      if (t && !form.tags.includes(t)) update('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => update('tags', form.tags.filter(t => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const article: Article = {
      id: initialArticle?.id || Date.now().toString(),
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      title: form.title,
      subtitle: form.subtitle,
      excerpt: form.excerpt,
      content: form.content,
      category: form.series ? (form.category || undefined) : (form.category || 'Chưa phân loại'),
      type: form.type,
      tags: form.tags,
      series: form.series || null,
      seriesOrder: form.seriesOrder ? parseInt(form.seriesOrder) : null,
      featured: form.featured,
      status: form.status,
      date: form.date,
      readingTime: parseInt(form.readingTime) || 5,
      coverImage: form.coverImage || null,
      author: form.author,
      footnotes: form.footnotes,
    };

    try {
      const res = await fetch('/api/articles', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      });

      if (res.ok) {
        setMsg('✓ Đã lưu thành công!');
        if (!isEdit) router.push('/admin/articles');
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
    if (!confirm('Xác nhận xóa bài viết này?')) return;
    const res = await fetch(`/api/articles?slug=${form.slug}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/articles');
  };

  return (
    <form onSubmit={handleSubmit}>
      {msg && (
        <div style={{ padding: '12px 16px', background: msg.startsWith('✓') ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: msg.startsWith('✓') ? 'var(--success)' : 'var(--error)' }}>
          {msg}
        </div>
      )}

      <div className="editor-grid">
        {/* Main Editor */}
        <div className="editor-main">
          <div className="form-group">
            <label className="form-label">Tiêu đề *</label>
            <input className="form-input" style={{ fontSize: '1.1rem' }} value={form.title} onChange={e => update('title', e.target.value)} placeholder="Tiêu đề bài viết..." required />
          </div>

          <div className="form-group">
            <label className="form-label">Phụ đề</label>
            <input className="form-input" value={form.subtitle} onChange={e => update('subtitle', e.target.value)} placeholder="Phụ đề hoặc mô tả ngắn..." />
          </div>

          <div className="form-group">
            <label className="form-label">Tóm tắt (hiển thị ngoài danh sách) *</label>
            <textarea className="form-textarea" value={form.excerpt} onChange={e => update('excerpt', e.target.value)} placeholder="2-3 câu giới thiệu bài viết..." required style={{ minHeight: '80px' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Nội dung bài viết (WYSIWYG) *</label>
            <RichTextEditor
              ref={editorRef}
              content={form.content}
              onChange={html => update('content', html)}
              onAddFootnote={handleAddFootnote}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="editor-sidebar">
          {/* Footnotes management */}
          <div className="admin-card">
            <p className="admin-card-title">Quản Lý Chú Thích ({form.footnotes.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {form.footnotes.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                  Chưa có chú thích. Nhấn icon # trong toolbar để chèn.
                </p>
              ) : (
                form.footnotes.map((fn) => (
                  <div key={fn.id} style={{ padding: '10px', background: 'var(--paper-dark)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>CHÚ THÍCH [{fn.num}]</span>
                      <button
                        type="button"
                        onClick={() => removeFootnote(fn.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      placeholder="Nội dung chú thích..."
                      value={fn.content}
                      onChange={(e) => updateFootnote(fn.id, e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        fontSize: '0.85rem',
                        padding: '8px',
                        borderRadius: '2px',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--font-body)',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="admin-card">
            <p className="admin-card-title">Xuất Bản</p>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select className="sort-select" value={form.status} onChange={e => update('status', e.target.value)}>
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
              <label className="form-label">Ngày đăng</label>
              <input type="date" className="form-input" value={form.date} onChange={e => update('date', e.target.value)} />
            </div>
            <div className="toggle-row" style={{ marginTop: 'var(--space-3)' }}>
              <span className="toggle-label">★ Bài nổi bật</span>
              <label className="toggle">
                <input type="checkbox" checked={form.featured} onChange={e => update('featured', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo bài viết')}
              </button>
            </div>
            {isEdit && (
              <button type="button" onClick={handleDelete} className="btn-delete" style={{ width: '100%', marginTop: 'var(--space-2)' }}>
                Xóa bài viết
              </button>
            )}
          </div>

          {/* Meta */}
          {!form.series && (
            <div className="admin-card">
              <p className="admin-card-title">Phân Loại</p>
              <div className="form-group">
                <label className="form-label">Chủ đề / Danh mục *</label>

                <div className="category-suggestions" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {categories.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`category-pill ${form.category === c ? 'active' : ''}`}
                      onClick={() => update('category', c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="form-input"
                    value={form.category}
                    onChange={e => update('category', e.target.value)}
                    placeholder="Nhập chủ đề mới..."
                    required
                  />
                  {!categories.includes(form.category) && form.category.trim() !== '' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      title="Lưu vào danh sách gợi ý"
                      onClick={async () => {
                        // Logic to save new category to config
                        const res = await fetch('/api/config', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ categories: [...categories, form.category.trim()] }),
                        });
                        if (res.ok) {
                          router.refresh();
                          setMsg('✓ Đã lưu danh mục mới!');
                        }
                      }}
                    >
                      Thêm
                    </button>
                  )}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                <label className="form-label">Tags (Enter để thêm)</label>
                <div className="tags-input-wrapper" onClick={() => document.getElementById('tag-input')?.focus()}>
                  {form.tags.map(tag => (
                    <span key={tag} className="tag-pill-remove">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                  <input
                    id="tag-input"
                    className="tags-input-field"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={form.tags.length === 0 ? 'thêm tag...' : ''}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label">Loại nội dung</label>
                <select className="sort-select" value={form.type} onChange={e => update('type', e.target.value)}>
                  <option value="articles">Bài viết</option>
                  <option value="translation">Bài dịch</option>
                </select>
              </div>
            </div>
          )}

          {/* Series */}
          <div className="admin-card">
            <p className="admin-card-title">Bộ Sưu Tập / Series</p>
            <div className="form-group">
              <label className="form-label">Chọn series có sẵn</label>
              <div className="category-suggestions" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                <button
                  type="button"
                  className={`category-pill ${!form.series ? 'active' : ''}`}
                  onClick={() => update('series', '')}
                >
                  Không có series
                </button>
                {seriesList.map(s => (
                  <button
                    key={s.slug}
                    type="button"
                    className={`category-pill ${form.series === s.title ? 'active' : ''}`}
                    onClick={() => update('series', s.title)}
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="form-input"
                  value={form.series}
                  onChange={e => update('series', e.target.value)}
                  placeholder="Hoặc nhập tên series mới..."
                />
                {form.series && !seriesList.some(s => s.title === form.series) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    title="Tạo series mới"
                    onClick={async () => {
                      const slug = form.series.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[đĐ]/g, 'd')
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');

                      const newSeries: Series = {
                        slug,
                        title: form.series,
                        description: `Lời giới thiệu cho series ${form.series}...`,
                        coverImage: null,
                        type: form.type,
                        status: 'published'
                      };

                      const res = await fetch('/api/series', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newSeries),
                      });

                      if (res.ok) {
                        router.refresh();
                        setMsg('✓ Đã tạo series mới!');
                      }
                    }}
                  >
                    Thêm
                  </button>
                )}
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
              <label className="form-label">Thứ tự trong series (Phần số...)</label>
              <input type="number" className="form-input" value={form.seriesOrder} onChange={e => update('seriesOrder', e.target.value)} placeholder="VD: 1" />
            </div>
          </div>

          {/* Misc */}
          <div className="admin-card">
            <p className="admin-card-title">Thông Tin Khác</p>
            <div className="form-group">
              <label className="form-label">Tác giả</label>
              <input className="form-input" value={form.author} onChange={e => update('author', e.target.value)} placeholder="Tên tác giả" />
            </div>
            <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
              <label className="form-label">Ảnh bìa</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input className="form-input" value={form.coverImage} onChange={e => update('coverImage', e.target.value)} placeholder="https://... hoặc tải lên" />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Tải lên
                </button>
              </div>
              <input
                id="cover-upload"
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
                <img src={form.coverImage} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'contain', background: 'var(--parchment, #f5f0e8)', borderRadius: '4px', border: '1px solid var(--border)' }} />
              )}
            </div>
            <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
              <label className="form-label">Thời gian đọc (phút)</label>
              <input type="number" className="form-input" value={form.readingTime} onChange={e => update('readingTime', e.target.value)} min="1" />
            </div>
            {!isEdit && (
              <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                <label className="form-label">Slug (URL) — tự động nếu để trống</label>
                <input className="form-input" value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="ten-bai-viet" />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
