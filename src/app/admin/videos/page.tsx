'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  url: string;
  description: string;
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const res = await fetch('/api/admin/videos');
    const data = await res.json();
    setVideos(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    setLoading(true);
    const res = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, description })
    });

    if (res.ok) {
      setTitle('');
      setUrl('');
      setDescription('');
      fetchVideos();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa video này?')) return;

    const res = await fetch(`/api/admin/videos?id=${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchVideos();
    }
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="admin-v-container">
      <div className="admin-v-header">
        <div>
          <h1 className="admin-v-title">Quản lý Video</h1>
          <p className="admin-v-subtitle">Cập nhật thư viện phim tư liệu và âm nhạc của bạn.</p>
        </div>
        <Link href="/admin" className="admin-v-back">
          ← Quay lại Dashboard
        </Link>
      </div>

      <div className="admin-v-content">
        {/* Form bên trái */}
        <div className="admin-v-sidebar">
          <div className="admin-v-card-form">
            <h2 className="admin-v-card-title">✦ Thêm video mới</h2>
            <form onSubmit={handleAdd} className="admin-v-form">
              <div className="admin-v-field">
                <label>Tiêu đề video</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề hấp dẫn..."
                  required
                />
              </div>
              <div className="admin-v-field">
                <label>Link YouTube</label>
                <input 
                  type="text" 
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
              <div className="admin-v-field">
                <label>Mô tả ngắn</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={4}
                  placeholder="Đôi lời giới thiệu về video này..."
                />
              </div>
              <button type="submit" disabled={loading} className="admin-v-submit">
                {loading ? 'Đang lưu...' : 'Lưu Video'}
              </button>
            </form>
          </div>
        </div>

        {/* Danh sách bên phải */}
        <div className="admin-v-main">
          <h2 className="admin-v-card-title">Danh sách hiện tại ({videos.length})</h2>
          
          {videos.length === 0 ? (
            <div className="admin-v-empty">
              <p>Chưa có video nào. Hãy thêm video đầu tiên ở bên trái.</p>
            </div>
          ) : (
            <div className="admin-v-list">
              {videos.map(v => {
                const yid = getYoutubeId(v.url);
                return (
                  <div key={v.id} className="admin-v-item">
                    <div className="admin-v-thumb">
                      {yid ? (
                        <img src={`https://img.youtube.com/vi/${yid}/mqdefault.jpg`} alt={v.title} />
                      ) : (
                        <div className="no-thumb">No Image</div>
                      )}
                    </div>
                    
                    <div className="admin-v-info">
                      <h4>{v.title}</h4>
                      <p className="v-url">{v.url}</p>
                      <p className="v-desc">{v.description || 'Không có mô tả'}</p>
                    </div>

                    <button onClick={() => handleDelete(v.id)} className="admin-v-delete" title="Xóa video">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-v-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: var(--font-ui), sans-serif;
        }
        .admin-v-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
        }
        .admin-v-title {
          font-family: var(--font-serif);
          font-size: 2.5rem;
          color: var(--ink);
          margin: 0;
        }
        .admin-v-subtitle {
          color: var(--ink-muted);
          margin: 5px 0 0 0;
        }
        .admin-v-back {
          color: var(--gold);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .admin-v-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 40px;
        }
        @media (max-width: 900px) {
          .admin-v-content { grid-template-columns: 1fr; }
        }
        .admin-v-card-form {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 30px;
          border-radius: 16px;
          position: sticky;
          top: 40px;
        }
        .admin-v-card-title {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          margin-bottom: 25px;
          color: var(--ink);
        }
        .admin-v-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .admin-v-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .admin-v-field label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--ink-muted);
          letter-spacing: 1px;
        }
        .admin-v-field input, .admin-v-field textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--paper);
          color: var(--ink);
          font-family: inherit;
        }
        .admin-v-submit {
          background: var(--ink);
          color: white;
          padding: 15px;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .admin-v-submit:hover { background: var(--gold); }
        .admin-v-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .admin-v-item {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 15px;
          border-radius: 12px;
          display: flex;
          gap: 20px;
          align-items: center;
          transition: border-color 0.2s;
        }
        .admin-v-item:hover { border-color: var(--gold); }
        .admin-v-thumb {
          width: 120px;
          height: 70px;
          background: var(--paper-dark);
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .admin-v-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .admin-v-info { flex: 1; min-width: 0; }
        .admin-v-info h4 { margin: 0 0 5px 0; font-size: 1.1rem; }
        .v-url { font-size: 0.75rem; color: var(--gold); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .v-desc { font-size: 0.85rem; color: var(--ink-light); margin: 5px 0 0 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .admin-v-delete {
          background: none;
          border: none;
          color: var(--ink-muted);
          cursor: pointer;
          padding: 10px;
        }
        .admin-v-delete:hover { color: #ff4444; }
      `}</style>
    </div>
  );
}
