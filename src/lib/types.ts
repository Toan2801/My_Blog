export interface Footnote {
  id: string;
  num: number;
  content: string;
}

export interface ArticlePage {
  pageNumber: number;
  imageUrl: string;
}

export interface ArticleMarkdownPage {
  pageNumber: number;
  markdown: string;
}

export type ArticleType = 'articles' | 'translation';

export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category?: string;
  type: ArticleType;
  tags: string[];
  series: string | null;
  seriesOrder: number | null;
  date: string;
  featured: boolean;
  author: string;
  coverImage: string | null;
  status: ArticleStatus;
  readingTime: number;
}

export interface EditableArticle extends Article {
  content: string;
  footnotes?: Footnote[];
}

export interface RasterizedArticleAssets {
  pages: ArticlePage[];
  markdownPages: ArticleMarkdownPage[];
}

export interface Series {
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  type: 'articles' | 'translation';
  category?: string;
  status: 'draft' | 'published';
  featured?: boolean;
}

export interface SiteConfig {
  blogTitle: string;
  blogSubtitle: string;
  blogDescription: string;
  authorName: string;
  authorBio: string;
  authorEmail: string;
  authorAvatar: string;
  featuredArticleSlug: string;
  quoteBlock: { text: string; author: string };
  suggestedReading: string[];
  categories: string[];
  donation: { text: string; qrImage: string | null };
  facebook?: string;
  heroImage?: string;
}
