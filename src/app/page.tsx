import Link from 'next/link';
import {
  getPublicArticleSummaries,
  getPublicSiteConfig,
} from '@/lib/public-data';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trang Chủ',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 30) return `${days} ngày trước`;
  return formatDate(dateStr);
}

export default async function HomePage() {
  const [config, allArticles] = await Promise.all([
    getPublicSiteConfig(),
    getPublicArticleSummaries(),
  ]);

  const published = allArticles
    .filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featured = published.find(a => a.featured) || published[0];
  const older = published.filter(a => a.slug !== featured?.slug);

  return (
    <div className="box-border flex w-full flex-1 flex-col gap-5 px-8 py-6 max-md:p-4">
      {featured && (
        <Link
          href={`/articles/${featured.slug}`}
          className="grid items-stretch gap-4 overflow-hidden rounded-xl border border-normal bg-base text-inherit no-underline transition hover:shadow-md grid-cols-[320px_1fr] max-lg:grid-cols-[260px_1fr] max-md:grid-cols-1"
        >
          <div className="relative size-full min-h-48 overflow-hidden bg-surface max-md:min-h-40">
            {featured.coverImage ? (
              <img src={featured.coverImage} alt={featured.title} />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-2 px-4 py-4 pl-0 max-md:p-4">
            <div className="flex items-center gap-2 text-xs text-subtle">
              <span className="font-semibold text-normal">
                {featured.author || config.authorName}
              </span>
              <span className="text-muted">· {timeAgo(featured.date)}</span>
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-themed">Nổi bật</span>
            </div>
            <h2 className="m-0 text-base font-bold text-normal">{featured.title}</h2>
            {featured.excerpt && (
              <p className="m-0 line-clamp-3 text-sm leading-6 text-subtle">{featured.excerpt}</p>
            )}
          </div>
        </Link>
      )}

      <div className="my-0 mt-2 mb-1 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-surface" />
        Bài đăng cũ hơn
        <span className="h-px flex-1 bg-surface" />
      </div>

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
        {older.map(article => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="box-border flex w-full flex-col gap-2.5 rounded-xl border border-normal bg-base px-3.5 pb-3 pt-3.5 text-inherit no-underline transition hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-xs text-subtle">
              <span className="font-semibold text-normal">
                {article.author || config.authorName}
              </span>
              <span className="text-muted">· {timeAgo(article.date)}</span>
            </div>
            <h3 className="m-0 line-clamp-2 text-base font-bold leading-6 text-normal">{article.title}</h3>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface">
              {article.coverImage ? (
                <img src={article.coverImage} alt={article.title} />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-muted">Không có ảnh bìa</div>
              )}
              {article.tags.length > 0 && (
                <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] flex-wrap gap-1">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="rounded-full bg-base px-2 py-0.5 text-normal text-xs font-semibold whitespace-nowrap backdrop-blur-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-0.5 flex gap-2">
              <span className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-normal bg-surface px-2.5 py-1.5 text-xs font-medium text-subtle no-underline transition-colors hover:bg-hover hover:text-normal">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Bình luận
              </span>
              <span className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-normal bg-surface px-2.5 py-1.5 text-xs font-medium text-subtle no-underline transition-colors hover:bg-hover hover:text-normal">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Lưu
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
