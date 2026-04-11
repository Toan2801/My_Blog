'use client';

import { useState, useRef } from 'react';
import { getSiteConfig } from '@/lib/data';

export default function DonationPage() {
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [donationText, setDonationText] = useState('');
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setQrPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setMsg('Vui lòng chọn ảnh QR'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('qr', file);
    const res = await fetch('/api/upload-qr', { method: 'POST', body: fd });
    if (res.ok) {
      setMsg('✓ Đã upload QR thành công!');
    } else {
      setMsg('Lỗi khi upload');
    }
    setUploading(false);
  };

  const handleSaveText = async () => {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donation: { text: donationText, qrImage: null } }),
    });
    setMsg(res.ok ? '✓ Đã lưu văn bản!' : 'Lỗi');
  };

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Cài Đặt Donation / QR</h1>
      </div>

      {msg && <div style={{ padding: '12px 16px', background: 'rgba(39,174,96,0.1)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-5)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--success)' }}>{msg}</div>}

      <div className="admin-card">
        <p className="admin-card-title">Upload Mã QR</p>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 'var(--space-4)' }}>
          Upload ảnh QR code (Momo, VietQR, v.v.) để hiển thị trên trang Liên Hệ.
        </p>

        {qrPreview ? (
          <img src={qrPreview} alt="QR Preview" style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 'var(--space-4)' }} />
        ) : (
          <div className="qr-placeholder" onClick={() => fileRef.current?.click()} style={{ marginBottom: 'var(--space-4)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Nhấp để chọn ảnh QR</span>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            {qrPreview ? 'Đổi ảnh khác' : 'Chọn ảnh'}
          </button>
          {qrPreview && (
            <button type="button" className="btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Đang upload...' : 'Upload QR'}
            </button>
          )}
        </div>
      </div>

      <div className="admin-card">
        <p className="admin-card-title">Văn Bản Kêu Gọi Ủng Hộ</p>
        <div className="form-group">
          <label className="form-label">Nội dung hiển thị</label>
          <textarea
            className="form-textarea"
            value={donationText}
            onChange={e => setDonationText(e.target.value)}
            placeholder="Nếu bạn thấy những bài viết này có giá trị..."
            style={{ minHeight: '100px' }}
          />
        </div>
        <button className="btn-primary" onClick={handleSaveText} style={{ marginTop: 'var(--space-3)' }}>
          Lưu văn bản
        </button>
      </div>
    </>
  );
}
