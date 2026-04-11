'use client';

import { useState, useEffect } from 'react';

interface Config {
  blogTitle: string;
  blogSubtitle: string;
  blogDescription: string;
  authorName: string;
  authorBio: string;
  authorEmail: string;
  featuredArticleSlug: string;
  quoteBlock: { text: string; author: string };
  categories: string[];
  donation: { text: string; qrImage: string };
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [catInput, setCatInput] = useState('');

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig);
  }, []);

  if (!config) return <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--ink-muted)' }}>Đang tải...</p>;

  const update = (key: string, val: unknown) => setConfig(c => c ? { ...c, [key]: val } : c);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setMsg(res.ok ? '✓ Đã lưu cài đặt!' : 'Lỗi khi lưu');
    setSaving(false);
  };

  const addCategory = () => {
    const c = catInput.trim();
    if (c && !config.categories.includes(c)) {
      update('categories', [...config.categories, c]);
      setCatInput('');
    }
  };

  const removeCategory = (cat: string) => {
    update('categories', config.categories.filter(c => c !== cat));
  };

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Cài Đặt Trang</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>

      {msg && <div style={{ padding: '12px 16px', background: 'rgba(39,174,96,0.1)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-5)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--success)' }}>{msg}</div>}

      <div className="admin-card">
        <p className="admin-card-title">Thông Tin Blog</p>
        {[
          { label: 'Tên Blog', key: 'blogTitle' },
          { label: 'Phụ đề', key: 'blogSubtitle' },
          { label: 'Mô tả', key: 'blogDescription' },
          { label: 'Tên tác giả', key: 'authorName' },
          { label: 'Email tác giả', key: 'authorEmail' },
          { label: 'Facebook cá nhân', key: 'facebook' },
          { label: 'Ảnh bìa trang chủ', key: 'heroImage' },
          { label: 'Slug bài nổi bật', key: 'featuredArticleSlug' },
        ].map(f => (
          <div key={f.key} className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">{f.label}</label>
            <input className="form-input" value={((config as unknown) as Record<string, string>)[f.key] || ''} onChange={e => update(f.key, e.target.value)} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Tiểu sử tác giả</label>
          <textarea className="form-textarea" value={config.authorBio} onChange={e => update('authorBio', e.target.value)} style={{ minHeight: '80px' }} />
        </div>
      </div>

      <div className="admin-card">
        <p className="admin-card-title">Khối Trích Dẫn (Trang Chủ)</p>
        <div className="form-group">
          <label className="form-label">Nội dung trích dẫn</label>
          <textarea className="form-textarea" value={config.quoteBlock.text} onChange={e => update('quoteBlock', { ...config.quoteBlock, text: e.target.value })} style={{ minHeight: '80px' }} />
        </div>
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <label className="form-label">Tác giả trích dẫn</label>
          <input className="form-input" value={config.quoteBlock.author} onChange={e => update('quoteBlock', { ...config.quoteBlock, author: e.target.value })} />
        </div>
      </div>

      <div className="admin-card">
        <p className="admin-card-title">Quản Lý Chủ Đề / Danh Mục</p>
        <div className="category-cloud" style={{ marginBottom: 'var(--space-4)' }}>
          {config.categories.map(cat => (
            <span key={cat} className="category-pill" style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {cat}
              <button onClick={() => removeCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.875rem', padding: '0' }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input className="form-input" value={catInput} onChange={e => setCatInput(e.target.value)} placeholder="Tên chủ đề mới..." onKeyDown={e => e.key === 'Enter' && addCategory()} style={{ flex: 1 }} />
          <button type="button" onClick={addCategory} className="btn-secondary">Thêm</button>
        </div>
      </div>

      <div className="admin-card">
        <p className="admin-card-title">Cấu Hình Ủng Hộ (Donation)</p>
        <div className="form-group">
          <label className="form-label">Văn bản kêu gọi ủng hộ</label>
          <textarea 
            className="form-textarea" 
            value={config.donation?.text || ''} 
            onChange={e => update('donation', { ...config.donation, text: e.target.value })} 
            style={{ minHeight: '80px' }} 
            placeholder="Ví dụ: Ủng hộ tác giả duy trì blog..."
          />
        </div>
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <label className="form-label">Đường dẫn ảnh QR Code</label>
          <input 
            className="form-input" 
            value={config.donation?.qrImage || ''} 
            onChange={e => update('donation', { ...config.donation, qrImage: e.target.value })} 
            placeholder="/uploads/qr-code.png"
          />
        </div>
      </div>
    </>
  );
}
