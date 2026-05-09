import Link from 'next/link';
import { getAllSeries } from '@/lib/data';

export default function AdminSeriesPage() {
  const allSeries = getAllSeries();

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Quản lý Series</h1>
        <Link href="/admin" className="btn-edit" style={{ textDecoration: 'none' }}>← Quay lại</Link>
      </div>

      <div className="admin-card">
        <div className="admin-article-list">
          {allSeries.map(s => (
            <div key={s.slug} className="admin-article-item">
              <div className="admin-article-info">
                <p className="admin-article-title">{s.title}</p>
                <p className="admin-article-meta">{s.slug}</p>
              </div>
              <div className="admin-actions">
                <Link href={`/admin/series/${s.slug}/edit`} className="btn-edit">Sửa thông tin</Link>
              </div>
            </div>
          ))}
          {allSeries.length === 0 && (
            <p style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--ink-muted)', fontStyle: 'italic' }}>Chưa có series nào.</p>
          )}
        </div>
      </div>
    </>
  );
}
