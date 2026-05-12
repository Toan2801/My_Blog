import Link from 'next/link';
import { getAllArticlesAdmin, getSiteConfig } from '@/lib/data';
import { getVideos } from '@/lib/video-data';
import DeleteArticleButton from '@/components/DeleteArticleButton';

export default function AdminDashboard() {
  const articles = getAllArticlesAdmin();
  const videos = getVideos();
  const published = articles.filter(a => a.status === 'published').length;
  const drafts = articles.filter(a => a.status === 'draft').length;
  const featured = articles.find(a => a.featured);

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Tổng quan</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link href="/admin/books" className="btn-edit" style={{ textDecoration: 'none' }}>📚 Quản lý sách</Link>
          <Link href="/admin/series" className="btn-edit" style={{ textDecoration: 'none' }}>Quản lý Series</Link>
          <Link href="/admin/videos" className="btn-edit" style={{ textDecoration: 'none' }}>Quản lý Video</Link>
          <Link href="/admin/articles/new" className="btn-primary" style={{ textDecoration: 'none' }}>+ Bài viết mới</Link>
        </div>
      </div>

      <div className="admin-card" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(212,175,55,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="admin-card-title" style={{ color: 'var(--gold)', marginBottom: '4px' }}>Quản lý Nội dung Series</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>Cập nhật ảnh bìa và lời giới thiệu cho các bộ sưu tập bài viết.</p>
          </div>
          <Link href="/admin/series" className="btn-primary" style={{ textDecoration: 'none', background: 'var(--gold)', color: 'black' }}>Vào quản lý →</Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Đã xuất bản', value: published, color: 'var(--success)' },
          { label: 'Bản nháp', value: drafts, color: 'var(--gold)' },
          { label: 'Bài viết', value: articles.length, color: 'var(--ink)' },
          { label: 'Video', value: videos.length, color: 'var(--blue-accent)' },
        ].map(s => (
          <div key={s.label} className="admin-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Featured */}
      <div className="admin-card">
        <p className="admin-card-title">Bài Viết Nổi Bật Hiện Tại</p>
        {featured ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}>{featured.title}</p>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{featured.category} · {featured.date}</p>
            </div>
            <div className="admin-actions">
              <Link href={`/admin/articles/${featured.slug}/edit`} className="btn-edit">Chỉnh sửa</Link>
              <DeleteArticleButton slug={featured.slug} />
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Chưa có bài nổi bật. Vào chỉnh sửa bài viết để đặt.</p>
        )}
      </div>

      {/* Recent articles */}
      <div className="admin-card">
        <p className="admin-card-title">Bài Viết Gần Đây</p>
        <div className="admin-article-list">
          {articles.slice(0, 5).map(a => (
            <div key={a.slug} className="admin-article-item">
              <div className="admin-article-info">
                <p className="admin-article-title">{a.title}</p>
                <p className="admin-article-meta">{a.category} · {a.date}</p>
              </div>
              <span className={`status-badge status-${a.status}`}>
                {a.status === 'published' ? 'Đã đăng' : 'Nháp'}
              </span>
              <div className="admin-actions">
                <Link href={`/admin/articles/${a.slug}/edit`} className="btn-edit">Sửa</Link>
                <DeleteArticleButton slug={a.slug} />
              </div>
            </div>
          ))}
        </div>
        {articles.length > 5 && (
          <Link href="/admin/articles" style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-4)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--gold)' }}>
            Xem tất cả ({articles.length}) →
          </Link>
        )}
      </div>
    </>
  );
}
