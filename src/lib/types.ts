export interface Footnote {
  id: string;
  num: number;
  content: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  category?: string;
  type: 'articles' | 'translation';
  tags: string[];
  series: string | null;
  seriesOrder: number | null;
  date: string;
  featured: boolean;
  author: string;
  coverImage: string | null;
  status: 'draft' | 'published';
  readingTime: number;
  footnotes?: Footnote[];
}

export interface Series {
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  type: 'articles' | 'translation';
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
