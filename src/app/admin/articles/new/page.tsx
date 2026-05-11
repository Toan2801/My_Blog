import { getSiteConfig, getAllSeries } from '@/lib/data';
import ArticleEditor from '@/components/ArticleEditor';
import { Suspense } from 'react';

export default function NewArticlePage() {
  const config = getSiteConfig();
  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Bài viết mới</h1>
      </div>
      <Suspense fallback={<div>Đang tải bộ soạn thảo...</div>}>
        <ArticleEditor categories={config.categories} seriesList={getAllSeries()} initialArticle={{ author: config.authorName }} />
      </Suspense>
    </>
  );
}
