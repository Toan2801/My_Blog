import { renderArticleMarkdown } from '@/lib/markdown';

export default function ArticleBody({ content }: { content: string }) {
  // `content` is the article's markdown source (post html-to-markdown migration).
  // Legacy HTML strings pass through unchanged via the isLikelyHtml branch.
  const html = renderArticleMarkdown(content);
  return (
    <div
      className="article-body article-content"
      style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
