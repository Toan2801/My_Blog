import Link from 'next/link';
import { getAllArticlesAdmin, getSiteConfig } from '@/lib/data';
import DeleteArticleButton from '@/components/DeleteArticleButton';

export default function AdminDashboard() {
  const articles = getAllArticlesAdmin();
  const published = articles.filter(a => a.status === 'published').length;
  const drafts = articles.filter(a => a.status === 'draft').length;
  const featured = articles.find(a => a.featured);

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Tổng Quan</h1>
        <Link href="/admin/articles/new" className="btn-primary">+ Bài viết mới</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Đã xuất bản', value: published, color: 'var(--success)' },
          { label: 'Bản nháp', value: drafts, color: 'var(--gold)' },
          { label: 'Tổng bài viết', value: articles.length, color: 'var(--ink)' },
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
