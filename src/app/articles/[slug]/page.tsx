import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicArticleBySlug } from '@/lib/public-data';
import Breadcrumb from '@/components/Breadcrumb';
import { auth } from '@/auth';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) return { title: 'Không tìm thấy' };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const [article, session] = await Promise.all([
    getPublicArticleBySlug(slug),
    auth(),
  ]);

  if (!article) notFound();
  if (article.status !== 'published') notFound();

  const isAuthed = !!session?.user?.id;

  return (
    <article>
      <div className="container" style={{ marginTop: 'var(--space-6)' }}>
        <Breadcrumb
          items={[
            { label: 'Bài viết', href: '/articles' },
            { label: article.title },
          ]}
        />

        <div className="book-detail">
          <div className="book-detail-cover">
            {article.coverImage ? (
              <img
                src={article.coverImage}
                alt={article.title}
                className="book-detail-cover-img"
              />
            ) : (
              <div className="book-detail-cover-placeholder" aria-hidden="true">
                <span>{article.title.slice(0, 1)}</span>
              </div>
            )}
          </div>

          <div className="book-detail-info">
            <h1 className="book-detail-title">{article.title}</h1>
            <p className="book-detail-author">{article.author}</p>
            <p className="book-detail-excerpt">{article.excerpt}</p>
            {isAuthed ? (
              <Link href={`/read/${slug}`} className="book-detail-read-btn">
                📖 Đọc sách
              </Link>
            ) : (
              <div className="book-detail-cta-group">
                <Link href={`/read/${slug}?trial=1`} className="book-detail-trial-btn">
                  📖 Đọc thử
                </Link>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/read/${slug}`)}`}
                  className="book-detail-read-btn"
                >
                  Đăng nhập để đọc tiếp
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
