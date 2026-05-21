'use client';

import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FaceSmileIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
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
  const saveDisabled = !dirty || saving;
  const publishDisabled = saving || (!isEdit && !form.title.trim());
  const editCardClassName = 'flex flex-col gap-2.5 rounded-xl border border-normal bg-base px-5 py-4 transition';
  const editCardPlainClassName = 'flex flex-col gap-2.5 rounded-xl border border-normal bg-base p-0 transition';
  const saveButtonClassName = [
    'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition [&_svg]:size-3.5',
    saveDisabled
      ? 'cursor-not-allowed bg-hover text-muted shadow-none'
      : 'bg-themed text-white hover:shadow-md hover:brightness-80',
  ].join(' ');
  const publishButtonClassName = [
    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition [&_svg]:size-3.5',
    isPublished
      ? publishDisabled
        ? 'cursor-not-allowed border border-normal bg-surface text-normal opacity-72'
        : 'border border-normal bg-surface text-normal hover:bg-hover hover:text-normal'
      : publishDisabled
        ? 'cursor-not-allowed bg-themed text-white opacity-72'
        : 'bg-themed text-white hover:shadow-md hover:brightness-80',
  ].join(' ');
        const PublishStatusIcon = isPublished ? ArrowDownTrayIcon : ArrowUpTrayIcon;

  return (
    <div className="box-border flex w-full flex-1 flex-col gap-5 px-8 py-6 max-md:p-4">
      <div className="sticky top-4 z-10 flex items-center justify-end gap-3">
        {msg && (
          <span
            className={`text-sm ${
              msg.kind === 'error'
                ? 'text-error'
                : msg.kind === 'success'
                  ? 'text-success'
                  : 'text-muted'
            }`}
          >
            {msg.text}
          </span>
        )}
        <button
          type="button"
          className={saveButtonClassName}
          disabled={saveDisabled}
          onClick={handleSave}
        >
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>

      {/* Card 1 — Title + Subtitle (no title label) */}
      <div className="flex flex-col gap-2.5">
        <div className={editCardClassName}>
          <div className="flex items-start gap-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-base text-subtle">
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent py-0.5 text-base font-semibold text-normal outline-none placeholder:font-medium placeholder:text-muted"
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  placeholder="Tiêu đề"
                />
              </div>
              <input
                className="w-full border-0 bg-transparent py-0.5 text-base text-normal outline-none placeholder:text-muted"
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
          <div className="h-px mt-1 mb-0 -mx-5 bg-hover" />
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full p-1 text-muted transition-colors hover:bg-surface hover:text-normal [&_svg]:size-4"
              title="Cảm xúc"
              onClick={() => { /* placeholder */ }}
            >
              <FaceSmileIcon />
            </button>
            <button
              type="button"
              className={publishButtonClassName}
              disabled={publishDisabled}
              onClick={handleToggleRelease}
              title={isPublished ? 'Thu hồi bài đăng' : 'Xuất bản bài đăng'}
            >
              <PublishStatusIcon />
              {isPublished ? 'Thu hồi' : 'Xuất bản'}
            </button>
          </div>
        </div>
      </div>

      {/* Card 2 — Tóm tắt */}
      <div className="flex flex-col gap-2.5">
        <div className="pl-1 text-xs font-bold tracking-wider text-subtle">Tóm tắt</div>
        <div className={editCardPlainClassName}>
          <DiscordMarkdownEditor
            value={form.excerpt}
            onChange={v => update('excerpt', v)}
            placeholder="Đoạn giới thiệu ngắn xuất hiện ngoài danh sách…"
            minHeight={140}
          />
        </div>
      </div>

      {/* Card 3 — Nội dung */}
      <div className="flex flex-col gap-2.5">
        <div className="pl-1 text-xs font-bold tracking-wider text-subtle">Nội dung</div>
        <div className={editCardPlainClassName}>
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
        className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-normal bg-surface text-muted transition-colors hover:bg-hover hover:text-normal [&_svg]:size-6"
        onClick={() => document.getElementById(inputId)?.click()}
        title={value ? 'Thay ảnh bìa' : 'Thêm ảnh bìa'}
      >
        {value ? (
          <img src={value} alt="" className="size-full rounded-[inherit] object-cover" />
        ) : (
          <PhotoIcon />
        )}
      </button>
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept="image/*"
        aria-label="Tải ảnh bìa lên"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) void handleUpload(f);
        }}
      />
    </>
  );
}
