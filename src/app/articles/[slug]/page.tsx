import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicArticleBySlug } from '@/lib/public-data';
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
    <article className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-normal">
          Trang chủ
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-subtle">{article.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start xl:gap-12">
        <div className="mx-auto w-full max-w-80 lg:mx-0">
          <div className="flex h-[30rem] w-full items-center justify-center overflow-hidden rounded-3xl border border-normal bg-surface shadow-sm">
            {article.coverImage ? (
              <img
                src={article.coverImage}
                alt={article.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl font-bold text-muted">
                {article.title.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:pt-3">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
              {article.author}
            </p>
            <h1 className="text-3xl font-bold leading-tight text-strong md:text-4xl xl:text-5xl">
              {article.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-subtle md:text-lg">
              {article.excerpt}
            </p>
          </div>

          {isAuthed ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/read/${slug}`}
                className="inline-flex items-center justify-center rounded-2xl bg-themed px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Đọc sách
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/read/${slug}?trial=1`}
                className="inline-flex items-center justify-center rounded-2xl border border-normal bg-surface px-5 py-3 text-sm font-semibold text-normal transition-colors hover:bg-hover"
              >
                Đọc thử
              </Link>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/read/${slug}`)}`}
                className="inline-flex items-center justify-center rounded-2xl bg-themed px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Đăng nhập để đọc tiếp
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
