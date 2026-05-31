import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeriesBySlug, getArticlesBySeries, getSiteConfig } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import Breadcrumb from '@/components/Breadcrumb';
import SupportQR from '@/components/SupportQR';
import { auth } from '@/auth';
import DeleteArticleButton from '@/components/DeleteArticleButton';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) return { title: 'Không tìm thấy series' };
  return {
    title: `${series.title} - Series`,
    description: series.description,
  };
}

export default async function SeriesLandingPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) notFound();

  const articles = getArticlesBySeries(series.title);
  const config = getSiteConfig();
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="container" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
      <Breadcrumb items={[
        { label: 'Bài viết', href: '/articles' },
        { label: series.title },
      ]} />

      <header style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        {series.coverImage && (
          <div style={{ marginBottom: 'var(--space-6)', maxWidth: '300px', margin: '0 auto var(--space-6)' }}>
            <img
              src={series.coverImage}
              alt={series.title}
              style={{ width: '100%', aspectRatio: '2/3', objectFit: 'fill', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)' }}
            />
          </div>
        )}
        <span className="featured-badge" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
          Series {series.type === 'translation' ? 'Dịch' : 'Viết'}
        </span>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: 'var(--space-4)' }}>{series.title}</h1>
        <div
          style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1rem', color: 'var(--ink-light)', lineHeight: '1.8', marginBottom: 'var(--space-4)' }}
          dangerouslySetInnerHTML={{ __html: series.description.replace(/\n/g, '<br/>') }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          {isAdmin ? (
            <Link 
              href={`/admin/articles/new?series=${encodeURIComponent(series.title)}`}
              className="btn-primary"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
              title="Tạo bài viết mới cho series này"
            >
              ➕ Thêm bài viết mới
            </Link>
          ) : (
            <button 
              className="btn-primary disabled"
              disabled
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '30px',
                fontWeight: 600,
                fontSize: '0.95rem',
                opacity: 0.5,
                cursor: 'not-allowed'
              }}
              title="Bạn cần đăng nhập với quyền Admin để tạo bài viết mới"
            >
              ➕ Thêm bài viết mới
            </button>
          )}
        </div>
      </header>

      <SupportQR qrImage={config.donation.qrImage} facebookUrl={config.facebook} />

      {/* Book-cover grid */}
      <section style={{ marginTop: 'var(--space-8)' }}>
        <p className="section-label">Các phần ({articles.length})</p>
        <div className="series-book-grid">
          {articles.map((article, index) => (
            <div key={article.slug} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href={`/articles/${article.slug}`} className="book-cover-card">
                {article.coverImage ? (
                  <img src={article.coverImage} alt={article.title} className="book-cover-image" />
                ) : (
                  <div className="book-cover-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif)' }}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                )}
                <span className="book-cover-title">{article.title}</span>
                <span className="book-cover-meta">{article.readingTime} phút đọc</span>
              </Link>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                {article.pages && article.pages.length > 0 && (
                  <Link 
                    href={`/read/${article.slug}`}
                    className="btn-primary"
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                    }}
                  >
                    📖 Đọc
                  </Link>
                )}
                {isAdmin ? (
                  <>
                    <Link 
                      href={`/admin/articles/${article.slug}/edit`}
                      className="edit-article-btn"
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                        textDecoration: 'none',
                      }}
                      title="Sửa bài viết"
                    >
                      ✏️ Sửa
                    </Link>
                    <DeleteArticleButton 
                      slug={article.slug} 
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                      }}
                    />
                  </>
                ) : (
                  <>
                    <button 
                      className="edit-article-btn disabled"
                      disabled
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                      }}
                      title="Bạn cần đăng nhập với quyền Admin để sửa bài viết"
                    >
                      ✏️ Sửa
                    </button>
                    <button 
                      className="delete-article-btn disabled"
                      disabled
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                      }}
                      title="Bạn cần đăng nhập với quyền Admin để xóa bài viết"
                    >
                      🗑️ Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
        <Link href="/" className="btn-secondary" style={{ display: 'inline-block', padding: '12px 32px' }}>← Trở về trang chủ</Link>
      </div>
    </div>
  );
}
