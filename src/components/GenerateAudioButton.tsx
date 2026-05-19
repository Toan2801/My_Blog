'use client';

import { useState } from 'react';

export default function GenerateAudioButton({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    if (!slug) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/articles/${slug}/generate-audio`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'failed');
      setMsg(`✓ Đã tạo audio`);
    } catch (e) {
      setMsg(`✗ Lỗi: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
      <button type="button" className="btn-edit" onClick={run} disabled={busy}>
        {busy ? '⏳ Đang tạo Audio…' : '🎙 Tạo Audio (GCP)'}
      </button>
      {msg && (
        <span style={{ fontSize: '0.82rem', color: msg.startsWith('✓') ? '#1f6c3a' : '#b3261e' }}>
          {msg}
        </span>
      )}
    </div>
  );
}
