import { getSiteConfig, getAllSeries } from '@/lib/data';
import ArticleEditor from '@/components/ArticleEditor';

export default async function NewArticlePage() {
  const config = await getSiteConfig();
  const seriesList = await getAllSeries();
  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Bài Viết Mới</h1>
      </div>
      <ArticleEditor categories={config.categories} seriesList={seriesList} initialArticle={{ author: config.authorName }} />
    </>
  );
}
