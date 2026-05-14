import { getSiteConfig } from '@/lib/data';
import DiscordArticleEditor from '@/components/DiscordArticleEditor';

export default async function NewArticlePage() {
  const config = await getSiteConfig();
  return (
    <DiscordArticleEditor
      authorName={config.authorName}
      defaultCategory={config.categories[0]}
    />
  );
}
