import SeriesEditor from '@/components/SeriesEditor';
import { Series } from '@/lib/types';
import Link from 'next/link';

export default function NewSeriesPage() {
  const emptySeries: Series = {
    slug: '',
    title: '',
    description: '',
    coverImage: null,
    type: 'articles',
    category: '',
    status: 'draft',
    featured: false
  };

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Tạo Series Mới</h1>
        <Link href="/admin/series" className="btn-edit" style={{ textDecoration: 'none' }}>← Hủy</Link>
      </div>
      <SeriesEditor series={emptySeries} articles={[]} />
    </>
  );
}
