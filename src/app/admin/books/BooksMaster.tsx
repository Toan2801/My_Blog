'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface BookRow {
  slug: string;
  title: string;
  author: string;
  category: string;
  status: 'draft' | 'published';
  updatedAt: string | null;
}

interface Props {
  initial: BookRow[];
}

export default function BooksMaster({ initial }: Props) {
  const router = useRouter();
  const [books, setBooks] = useState(initial);

  const deleteOne = async (slug: string) => {
    if (!confirm(`Xoá sách "${slug}"? Hành động này không thể hoàn tác.`)) return;
    const res = await fetch(`/api/articles?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (res.ok) {
      setBooks((bs) => bs.filter((b) => b.slug !== slug));
      router.refresh();
    } else {
      alert('Xoá thất bại.');
    }
  };

  return (
    <div className="admin-card books-master">
      <div className="books-toolbar">
        <p className="text-sm text-muted">
          Trình đọc hiện tạo trang SVG theo yêu cầu, không còn bước tạo trang trước nữa.
        </p>
      </div>

      <table className="books-table">
        <thead>
          <tr>
            <th>Tiêu đề</th>
            <th>Tác giả</th>
            <th>Trạng thái</th>
            <th>Cập nhật</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => {
            return (
              <tr key={b.slug}>
                <td>
                  <Link href={`/admin/articles/${b.slug}/edit`} className="books-title-link">
                    {b.title}
                  </Link>
                  <div className="books-cat">{b.category}</div>
                </td>
                <td>{b.author}</td>
                <td>
                  <span className={`status-badge status-${b.status}`}>
                    {b.status === 'published' ? 'Đã đăng' : 'Nháp'}
                  </span>
                </td>
                <td>{b.updatedAt ? new Date(b.updatedAt).toLocaleString('vi-VN') : '—'}</td>
                <td>
                  <div className="books-actions">
                    <Link href={`/admin/articles/${b.slug}/edit`} className="btn-edit">Sửa</Link>
                    <button
                      type="button"
                      className="btn-edit btn-danger"
                      onClick={() => deleteOne(b.slug)}
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {books.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-6 text-center text-muted">Chưa có sách nào.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
