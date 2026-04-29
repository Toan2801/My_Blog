'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/comments?slug=${slug}`)
      .then(r => r.json())
      .then(data => {
        setComments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !text.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, author: author.trim(), text: text.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments([...comments, newComment]);
        setAuthor('');
        setText('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <section className="comments-section">
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-5)' }}>
        Bình luận {comments.length > 0 && `(${comments.length})`}
      </h3>

      {loading ? (
        <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>Đang tải bình luận...</p>
      ) : comments.length > 0 ? (
        <div className="comment-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <p className="comment-author">{c.author}</p>
              <p className="comment-date">{formatDate(c.date)}</p>
              <p className="comment-text">{c.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--ink-muted)', fontSize: '0.9rem' }}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      )}

      <div style={{ marginTop: 'var(--space-6)' }}>
        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginBottom: 'var(--space-4)' }}>
          Để lại bình luận
        </h4>
        {submitted && (
          <div style={{ padding: '12px', background: 'rgba(39,174,96,0.1)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-4)', color: 'var(--success)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem' }}>
            ✓ Cảm ơn bình luận của bạn!
          </div>
        )}
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="form-group">
            <label className="form-label" htmlFor="author">Tên của bạn *</label>
            <input
              id="author"
              className="form-input"
              type="text"
              placeholder="Nguyễn Văn A"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="comment-text">Nội dung *</label>
            <textarea
              id="comment-text"
              className="form-textarea"
              placeholder="Chia sẻ suy nghĩ của bạn về bài viết..."
              value={text}
              onChange={e => setText(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Gửi bình luận</button>
        </form>
      </div>
    </section>
  );
}
