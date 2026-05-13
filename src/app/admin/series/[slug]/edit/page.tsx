import { notFound } from 'next/navigation';
import { getSeriesBySlug } from '@/lib/data';
import SeriesEditor from '@/components/SeriesEditor';

export default async function EditSeriesPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Chỉnh sửa Series: {series.title}</h1>
      </div>
      <SeriesEditor series={series} />
    </>
  );
}
