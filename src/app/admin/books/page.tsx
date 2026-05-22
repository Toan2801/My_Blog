import Link from 'next/link';
import prisma from '@/lib/prisma';
import BooksMaster, { type BookRow } from './BooksMaster';

async function getBooks(): Promise<BookRow[]> {
  const docs = await prisma.article.findMany({
    select: {
      slug: true,
      title: true,
      author: true,
      category: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
  return docs.map((d) => ({
    slug: d.slug,
    title: d.title,
    author: d.author,
    category: d.category ?? '',
    status: d.status as 'draft' | 'published',
    updatedAt: d.updatedAt ? d.updatedAt.toISOString() : null,
  }));
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
