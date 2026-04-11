'use client';

export default function ArticleBody({ content }: { content: string }) {
  return (
    <div 
      className="article-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
