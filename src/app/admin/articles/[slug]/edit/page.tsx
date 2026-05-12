import { notFound } from 'next/navigation';
import { getArticleBySlug, getSiteConfig, getAllSeries } from '@/lib/data';
import ArticleEditor from '@/components/ArticleEditor';
import RasterizeButton from '@/components/RasterizeButton';

export default async function EditArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();
  const config = getSiteConfig();

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Chỉnh sửa bài viết</h1>
        <RasterizeButton slug={slug} />
      </div>
      <ArticleEditor initialArticle={article} categories={config.categories} seriesList={getAllSeries()} isEdit />
    </>
  );
}
