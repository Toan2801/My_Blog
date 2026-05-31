'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  slug: string;
  style?: React.CSSProperties;
}

export default function DeleteArticleButton({ slug, style }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles?slug=${slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (window.location.pathname.includes('/articles/') && !window.location.pathname.endsWith('/articles')) {
          window.location.href = '/articles';
        } else {
          window.location.reload();
        }
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
      className="delete-article-btn" 
      style={{ 
        opacity: deleting ? 0.5 : 1,
        cursor: deleting ? 'not-allowed' : 'pointer',
        ...style
      }}
      disabled={deleting}
    >
      {deleting ? '...' : '🗑️ Xóa'}
    </button>
  );
}
