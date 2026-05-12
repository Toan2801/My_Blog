import Link from 'next/link';
import dbConnect from '@/lib/mongoose';
import Article from '@/models/Article';
import BooksMaster, { type BookRow } from './BooksMaster';

async function getBooks(): Promise<BookRow[]> {
  await dbConnect();
  const docs = await Article.find({}).sort({ updatedAt: -1 }).lean();
  return docs.map((d) => {
    const updatedAt = (d as { updatedAt?: Date }).updatedAt;
    const rasterizedAt = (d as { rasterizedAt?: Date }).rasterizedAt ?? null;
    const isRasterized = !!rasterizedAt && !!updatedAt && rasterizedAt >= updatedAt;
    return {
      slug: d.slug as string,
      title: d.title as string,
      author: d.author as string,
      category: d.category as string,
      status: d.status as 'draft' | 'published',
      updatedAt: updatedAt ? updatedAt.toISOString() : null,
      rasterizedAt: rasterizedAt ? rasterizedAt.toISOString() : null,
      isRasterized,
    };
  });
}

export default async function AdminBooksPage() {
  const books = await getBooks();

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Quản lý sách</h1>
        <Link href="/admin/articles/new" className="btn-primary">+ Sách mới</Link>
      </div>
      <BooksMaster initial={books} />
    </>
  );
}
