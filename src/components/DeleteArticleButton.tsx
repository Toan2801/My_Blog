'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  slug: string;
}

export default function DeleteArticleButton({ slug }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Xác nhận xóa bài viết này? Hành động này không thể hoàn tác.')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles?slug=${slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Có lỗi xảy ra khi xóa bài viết.');
      }
    } catch (error) {
      alert('Lỗi kết nối.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleDelete} 
      className="btn-edit" 
      style={{ 
        color: 'var(--error)', 
        borderColor: 'rgba(192,57,43,0.2)',
        opacity: deleting ? 0.5 : 1,
        cursor: deleting ? 'not-allowed' : 'pointer'
      }}
      disabled={deleting}
    >
      {deleting ? '...' : 'Xóa'}
    </button>
  );
}
