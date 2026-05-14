import { notFound } from 'next/navigation';
import { getArticleForEditBySlug, getSiteConfig } from '@/lib/data';
import DiscordArticleEditor from '@/components/DiscordArticleEditor';

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleForEditBySlug(slug);
  if (!article) notFound();
  const config = await getSiteConfig();
  return (
    <DiscordArticleEditor
      initialArticle={article}
      authorName={config.authorName}
      defaultCategory={article.category || config.categories[0]}
      isEdit
    />
  );
}
