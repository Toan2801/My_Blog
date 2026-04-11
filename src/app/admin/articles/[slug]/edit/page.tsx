import { notFound } from 'next/navigation';
import { getArticleBySlug, getSiteConfig } from '@/lib/data';
import ArticleEditor from '@/components/ArticleEditor';

export default async function EditArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();
  const config = getSiteConfig();

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">Chỉnh Sửa Bài Viết</h1>
      </div>
      <ArticleEditor initialArticle={article} categories={config.categories} isEdit />
    </>
  );
}
