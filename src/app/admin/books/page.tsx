import Link from 'next/link';
import prisma from '@/lib/prisma';
import BooksMaster, { type BookRow } from './BooksMaster';

async function getBooks(): Promise<BookRow[]> {
  const docs = await prisma.article.findMany({ orderBy: { updatedAt: 'desc' } });
  return docs.map((d) => {
    const updatedAt = d.updatedAt;
    const rasterizedAt = d.rasterizedAt ?? null;
    const isRasterized = !!rasterizedAt && !!updatedAt && rasterizedAt >= updatedAt;
    return {
      slug: d.slug,
      title: d.title,
      author: d.author,
      category: d.category ?? '',
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
