import { getSiteConfig } from '@/lib/data';
import ArticleEditor from '@/components/ArticleEditor';

export default function NewArticlePage() {
  const config = getSiteConfig();
  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Bài Viết Mới</h1>
      </div>
      <ArticleEditor categories={config.categories} initialArticle={{ author: config.authorName }} />
    </>
  );
}
