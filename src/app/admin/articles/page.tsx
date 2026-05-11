import Link from 'next/link';
import { getAllArticlesAdmin } from '@/lib/data';
import DeleteArticleButton from '@/components/DeleteArticleButton';

export default function AdminArticlesPage() {
  const articles = getAllArticlesAdmin().filter(a => !a.series);

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Quản lý bài viết</h1>
        <Link href="/admin/articles/new" className="btn-primary">+ Bài viết mới</Link>
      </div>
      <div className="admin-card">
        <div className="admin-article-list">
          {articles.map(a => (
            <div key={a.slug} className="admin-article-item">
              <div className="admin-article-info">
                <p className="admin-article-title">
                  {a.featured && <span style={{ color: 'var(--gold)', marginRight: '6px' }}>★</span>}
                  {a.title}
                </p>
                <p className="admin-article-meta">{a.category} · {a.date} · {a.readingTime} phút đọc</p>
              </div>
              <span className={`status-badge status-${a.status}`}>
                {a.status === 'published' ? 'Đã đăng' : 'Nháp'}
              </span>
              <div className="admin-actions">
                <Link href={`/articles/${a.slug}`} target="_blank" className="btn-edit" style={{ textDecoration: 'none' }}>Xem</Link>
                <Link href={`/admin/articles/${a.slug}/edit`} className="btn-edit" style={{ textDecoration: 'none' }}>Sửa</Link>
                <DeleteArticleButton slug={a.slug} />
              </div>
            </div>
          ))}
          {articles.length === 0 && (
            <p style={{ color: 'var(--ink-muted)', fontStyle: 'italic', padding: 'var(--space-5) 0', textAlign: 'center', fontFamily: 'var(--font-ui)' }}>
              Chưa có bài viết nào. <Link href="/admin/articles/new">Tạo bài đầu tiên →</Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
