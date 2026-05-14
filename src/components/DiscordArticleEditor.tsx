'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EditableArticle } from '@/lib/types';
import { generateSlug } from '@/lib/utils';
import DiscordMarkdownEditor from './DiscordMarkdownEditor';

interface Props {
  initialArticle?: Partial<EditableArticle>;
  authorName: string;
  defaultCategory?: string;
  isEdit?: boolean;
}

interface FormState {
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  coverImage: string;
}

function buildInitial(a?: Partial<EditableArticle>): FormState {
  return {
    title: a?.title ?? '',
    subtitle: a?.subtitle ?? '',
    excerpt: a?.excerpt ?? '',
    content: a?.content ?? '',
    status: (a?.status as 'draft' | 'published') ?? 'draft',
    coverImage: a?.coverImage ?? '',
  };
}

export default function DiscordArticleEditor({ initialArticle, authorName, defaultCategory, isEdit }: Props) {
  const router = useRouter();
  const initial = useMemo(() => buildInitial(initialArticle), [initialArticle]);
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'info' | 'error' | 'success' } | null>(null);

  const dirty = useMemo(() => {
    return (
      form.title !== initial.title ||
      form.subtitle !== initial.subtitle ||
      form.excerpt !== initial.excerpt ||
      form.content !== initial.content ||
      form.status !== initial.status ||
      form.coverImage !== initial.coverImage
    );
  }, [form, initial]);

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const computeReadingTime = (text: string) => {
    const words = text.replace(/[#>*`_~\-]/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  async function persist(nextStatus: 'draft' | 'published'): Promise<boolean> {
    if (!form.title.trim()) {
      setMsg({ text: 'Cần nhập tiêu đề.', kind: 'error' });
      return false;
    }
    setSaving(true);
    setMsg(null);

    const slug = initialArticle?.slug || generateSlug(form.title);
    const article: EditableArticle = {
      id: initialArticle?.id || Date.now().toString(),
      slug,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      excerpt: form.excerpt.trim() || form.title.trim(),
      content: form.content,
      category: initialArticle?.category ?? defaultCategory ?? 'Chưa phân loại',
      type: initialArticle?.type ?? 'articles',
      tags: initialArticle?.tags ?? [],
      series: initialArticle?.series ?? null,
      seriesOrder: initialArticle?.seriesOrder ?? null,
      date: initialArticle?.date || new Date().toISOString().split('T')[0],
      featured: initialArticle?.featured ?? false,
      status: nextStatus,
      readingTime: computeReadingTime(form.content),
      coverImage: form.coverImage.trim() || null,
      author: initialArticle?.author || authorName,
      footnotes: initialArticle?.footnotes ?? [],
    };

    try {
      const res = await fetch('/api/articles', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
        setMsg({ text: 'Lỗi: ' + (err.error || res.statusText), kind: 'error' });
        setSaving(false);
        return false;
      }
      setMsg({ text: '✓ Đã lưu', kind: 'success' });
      setForm(f => ({ ...f, status: nextStatus }));
      if (!isEdit) {
        router.replace(`/admin/articles/${slug}/edit`);
        router.refresh();
      } else {
        router.refresh();
      }
      setSaving(false);
      return true;
    } catch {
      setMsg({ text: 'Lỗi kết nối', kind: 'error' });
      setSaving(false);
      return false;
    }
  }

  const handleSave = () => { void persist(form.status); };
  const handleToggleRelease = () => {
    const next = form.status === 'published' ? 'draft' : 'published';
    void persist(next);
  };

  const isPublished = form.status === 'published';

  return (
    <div className="dc-edit-shell">
      <div className="dc-edit-dock">
        {msg && <span className={`dc-edit-dock-status ${msg.kind}`}>{msg.text}</span>}
        <button
          type="button"
          className="dc-edit-save-btn"
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>

      {/* Card 1 — Title + Subtitle (no title label) */}
      <div className="dc-edit-section">
        <div className="dc-edit-card">
          <div className="dc-edit-card-body">
            <div className="dc-edit-card-fields">
              <div className="dc-edit-title-row">
                <input
                  className="dc-edit-title-input"
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  placeholder="Tiêu đề"
                />
              </div>
              <input
                className="dc-edit-subtitle-input"
                value={form.subtitle}
                onChange={e => update('subtitle', e.target.value)}
                placeholder="Phụ đề"
              />
            </div>
            <CoverImagePicker
              value={form.coverImage}
              onChange={v => update('coverImage', v)}
            />
          </div>
          <div className="dc-edit-card-divider" />
          <div className="dc-edit-card-footer">
            <button
              type="button"
              className="dc-edit-footer-icon"
              title="Cảm xúc"
              onClick={() => { /* placeholder */ }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            <button
              type="button"
              className={`dc-edit-publish-btn${isPublished ? ' withdraw' : ''}`}
              disabled={saving || (!isEdit && !form.title.trim())}
              onClick={handleToggleRelease}
              title={isPublished ? 'Thu hồi bài đăng' : 'Xuất bản bài đăng'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isPublished ? (
                  <>
                    <path d="M3 6h18" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </>
                ) : (
                  <>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </>
                )}
              </svg>
              {isPublished ? 'Thu hồi' : 'Xuất bản'}
            </button>
          </div>
        </div>
      </div>

      {/* Card 2 — Tóm tắt */}
      <div className="dc-edit-section">
        <div className="dc-edit-section-label">Tóm tắt</div>
        <div className="dc-edit-card" style={{ padding: 0 }}>
          <DiscordMarkdownEditor
            value={form.excerpt}
            onChange={v => update('excerpt', v)}
            placeholder="Đoạn giới thiệu ngắn xuất hiện ngoài danh sách…"
            minHeight={140}
          />
        </div>
      </div>

      {/* Card 3 — Nội dung */}
      <div className="dc-edit-section">
        <div className="dc-edit-section-label">Nội dung</div>
        <div className="dc-edit-card" style={{ padding: 0 }}>
          <DiscordMarkdownEditor
            value={form.content}
            onChange={v => update('content', v)}
            placeholder="Viết nội dung bài đăng với Markdown…"
            minHeight={420}
          />
        </div>
      </div>
    </div>
  );
}

function CoverImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputId = 'dc-edit-cover-upload';
  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      if (data.url) onChange(data.url);
    }
  };

  return (
    <>
      <button
        type="button"
        className="dc-edit-attach-btn"
        onClick={() => document.getElementById(inputId)?.click()}
        title={value ? 'Thay ảnh bìa' : 'Thêm ảnh bìa'}
      >
        {value ? (
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
            <path d="M16 3v4" />
            <path d="M14 5h4" />
          </svg>
        )}
      </button>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) void handleUpload(f);
        }}
      />
    </>
  );
}
