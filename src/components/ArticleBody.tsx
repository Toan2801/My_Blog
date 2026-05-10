'use client';

export default function ArticleBody({ content }: { content: string }) {
  return (
    <div 
      className="article-body article-content"
      style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
