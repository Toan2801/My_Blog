/* eslint-disable */
import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import satori from 'satori';
import { Noto_Sans } from 'next/font/google';
import { getArticleReaderBySlug, type ReaderSourceArticle } from './data';
import type { ArticleMarkdownPage, ArticlePage } from './types';

// Declare the font for Next.js font system (CSS injection in React components)
const _notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '600', '800'],
  display: 'swap',
});

const READER_FONT_FAMILY = 'Noto Sans';

const PAGE_WIDTH = 768;
const PAGE_HEIGHT = 1152;
const CONTENT_WORD_BUDGET = 180;
const IMAGE_BLOCK_BUDGET = 72;

type SatoriFontOption = NonNullable<Parameters<typeof satori>[1]['fonts']>[number];

type ReaderPageKind = 'cover' | 'content';

interface ReaderPageDescriptor {
  pageNumber: number;
  kind: ReaderPageKind;
  imageUrl: string;
  markdown: string;
}

export interface ReaderDocument {
  article: ReaderSourceArticle;
  pages: ArticlePage[];
  markdownPages: ArticleMarkdownPage[];
  totalPages: number;
  descriptors: ReaderPageDescriptor[];
}

const readerDocCache = new Map<string, { updatedAt: string; data: ReaderDocument }>();
let fontsPromise: Promise<SatoriFontOption[]> | null = null;

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[>*_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitMarkdownBlocks(markdown: string): string[] {
  const rawBlocks = markdown
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const blocks: string[] = [];
  for (let index = 0; index < rawBlocks.length; index++) {
    const current = rawBlocks[index];
    const next = rawBlocks[index + 1];
    if (/!\[[^\]]*\]\([^)]*\)/.test(current) && next && /^([*_])[\s\S]+\1$/.test(next)) {
      blocks.push(`${current}\n\n${next}`);
      index++;
      continue;
    }
    blocks.push(current);
  }
  return blocks;
}

function estimateBlockWeight(block: string): number {
  if (/!\[[^\]]*\]\([^)]*\)/.test(block)) {
    return IMAGE_BLOCK_BUDGET;
  }

  const wordCount = stripMarkdown(block).split(/\s+/).filter(Boolean).length;
  if (/^#{1,3}\s+/m.test(block)) {
    return Math.max(18, wordCount + 10);
  }
  if (/^\s*([-*+]\s+|\d+\.\s+)/m.test(block)) {
    return Math.ceil(wordCount * 1.15);
  }
  if (/^```/.test(block)) {
    return Math.ceil(wordCount * 1.25);
  }
  return Math.max(12, wordCount);
}

function paginateMarkdown(markdown: string): string[] {
  const blocks = splitMarkdownBlocks(markdown);
  if (blocks.length === 0) {
    return [];
  }

  const pages: string[] = [];
  let currentBlocks: string[] = [];
  let currentWeight = 0;

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    const weight = estimateBlockWeight(block);
    const nextBlock = blocks[index + 1] ?? '';

    if (
      /^#{1,3}\s+/m.test(block) &&
      currentBlocks.length > 0 &&
      currentWeight > CONTENT_WORD_BUDGET * 0.72
    ) {
      pages.push(currentBlocks.join('\n\n'));
      currentBlocks = [];
      currentWeight = 0;
    }

    if (currentBlocks.length > 0 && currentWeight + weight > CONTENT_WORD_BUDGET) {
      pages.push(currentBlocks.join('\n\n'));
      currentBlocks = [];
      currentWeight = 0;
    }

    currentBlocks.push(block);
    currentWeight += weight;

    if (/^#{1,3}\s+/m.test(block) && !nextBlock) {
      pages.push(currentBlocks.join('\n\n'));
      currentBlocks = [];
      currentWeight = 0;
    }
  }

  if (currentBlocks.length > 0) {
    pages.push(currentBlocks.join('\n\n'));
  }

  return pages;
}

function buildReaderDocument(article: ReaderSourceArticle): ReaderDocument {
  const contentPages = paginateMarkdown(article.content);
  const descriptors: ReaderPageDescriptor[] = [
    {
      pageNumber: 1,
      kind: 'cover',
      imageUrl: `/api/articles/${article.slug}/page/1/image`,
      markdown: '',
    },
    ...contentPages.map((markdown, index) => ({
      pageNumber: index + 2,
      kind: 'content' as const,
      imageUrl: `/api/articles/${article.slug}/page/${index + 2}/image`,
      markdown,
    })),
  ];

  return {
    article,
    pages: descriptors.map((page) => ({
      pageNumber: page.pageNumber,
      imageUrl: page.imageUrl,
    })),
    markdownPages: descriptors.map((page) => ({
      pageNumber: page.pageNumber,
      markdown: page.markdown,
    })),
    totalPages: descriptors.length,
    descriptors,
  };
}

async function readFirstExisting(pathsToTry: string[]): Promise<Buffer | null> {
  for (const filePath of pathsToTry) {
    try {
      return await fs.readFile(filePath);
    } catch {
      continue;
    }
  }
  return null;
}

async function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      // Google Fonts without a browser UA returns a single TTF per weight (all glyphs
      // including Vietnamese), which is what Satori needs. Avoid the subset-WOFF2 path
      // since it requires parsing multiple unicode-range blocks.
      const css = await fetch(
        'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;800&display=swap',
      ).then((r) => r.text());

      const blockPattern = /@font-face\s*\{([^}]+)\}/g;
      const downloads: Promise<SatoriFontOption | null>[] = [];
      let match: RegExpExecArray | null;

      while ((match = blockPattern.exec(css)) !== null) {
        const block = match[1];
        const urlMatch = block.match(/url\((https:\/\/[^)]+)\)/);
        const weightMatch = block.match(/font-weight:\s*(\d+)/);
        if (!urlMatch || !weightMatch) continue;

        const fontUrl = urlMatch[1];
        const weight = parseInt(weightMatch[1], 10);
        downloads.push(
          fetch(fontUrl)
            .then((r) => r.arrayBuffer())
            .then((data) => ({
              name: READER_FONT_FAMILY,
              data: Buffer.from(data),
              weight: weight as SatoriFontOption['weight'],
              style: 'normal' as const,
            }))
            .catch(() => null),
        );
      }

      const results = await Promise.all(downloads);
      const fonts: SatoriFontOption[] = results.filter((f): f is SatoriFontOption => f !== null);

      const hanFont = await readFirstExisting([path.join(process.cwd(), 'src', 'fonts', 'Jigmo.ttf')]);
      if (hanFont) {
        fonts.push({ name: 'Jigmo', data: hanFont, weight: 600, style: 'normal' });
      }

      if (fonts.length === 0) {
        throw new Error('No reader fonts available for Satori rendering.');
      }

      return fonts;
    })();
  }
  return fontsPromise;
}

function resolveAssetUrl(origin: string, src: string | undefined | null): string | undefined {
  if (!src) return undefined;
  if (/^(https?:|data:)/i.test(src)) return src;
  const normalized = src.startsWith('/') ? src : `/${src}`;
  return new URL(normalized, origin).toString();
}

function flattenChildren(children: unknown[]): unknown[] {
  return children.flatMap((child) => {
    if (Array.isArray(child)) return flattenChildren(child);
    if (child === null || child === undefined || child === false) return [];
    return [child];
  });
}

function sNode(
  type: unknown,
  props: Record<string, unknown> = {},
  ...children: unknown[]
) {
  const flatChildren = flattenChildren(children);
  return {
    type,
    props: {
      ...props,
      ...(flatChildren.length === 0
        ? {}
        : { children: flatChildren.length === 1 ? flatChildren[0] : flatChildren }),
    },
  };
}

function extractFirstHeading(markdown: string): string {
  const match = markdown.match(/^#{1,3}\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function renderMarkdown(markdown: string, origin: string) {
  return sNode(ReactMarkdown, {
    remarkPlugins: [remarkGfm],
    components: {
      h1: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', fontSize: 34, fontWeight: 800, lineHeight: 1.25, marginBottom: 20, color: '#2E2E34' },
      }, children),
      h2: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', fontSize: 28, fontWeight: 800, lineHeight: 1.3, marginBottom: 18, color: '#2E2E34' },
      }, children),
      h3: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', fontSize: 24, fontWeight: 600, lineHeight: 1.3, marginBottom: 16, color: '#2E2E34' },
      }, children),
      p: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', fontSize: 24, lineHeight: 1.375, marginBottom: 18, color: '#6C6C73' },
      }, children),
      strong: ({ children }: { children?: unknown }) => sNode('span', {
        style: { fontWeight: 600, color: '#2E2E34' },
      }, children),
      em: ({ children }: { children?: unknown }) => sNode('span', {
        style: { fontStyle: 'italic' },
      }, children),
      ul: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 },
      }, children),
      ol: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 },
      }, children),
      li: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', gap: 12, fontSize: 24, lineHeight: 1.375, color: '#6C6C73' },
      },
      sNode('span', { style: { width: 18, color: '#6C6C73' } }, '•'),
      sNode('span', { style: { flex: 1 } }, children)),
      blockquote: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', borderLeft: '6px solid rgba(151, 151, 159, 0.4)', paddingLeft: 18, marginBottom: 18, color: '#6C6C73' },
      }, children),
      code: ({ children }: { children?: unknown }) => sNode('span', {
        style: { fontFamily: READER_FONT_FAMILY, fontSize: 22, backgroundColor: '#f3f4f6', color: '#595961', paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, borderRadius: 6 },
      }, children),
      pre: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', marginBottom: 18, backgroundColor: '#f3f4f6', borderRadius: 16, padding: 20, color: '#2E2E34' },
      }, children),
      hr: () => sNode('div', {
        style: { display: 'flex', width: '100%', height: 1, backgroundColor: 'rgba(151, 151, 159, 0.28)', marginBottom: 18 },
      }),
      img: ({ src, alt }: { src?: string; alt?: string }) => {
        const resolved = resolveAssetUrl(origin, src);
        if (!resolved) return null;
        return sNode('div', {
          style: { display: 'flex', width: '100%', justifyContent: 'center', marginBottom: 18 },
        }, sNode('img', {
          src: resolved,
          alt: alt ?? '',
          style: { maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 18 },
        }));
      },
      a: ({ children }: { children?: unknown }) => sNode('span', {
        style: { color: '#915934', textDecoration: 'underline' },
      }, children),
    },
    children: markdown,
  });
}

function renderPageShell(document: ReaderDocument, page: ReaderPageDescriptor, origin: string) {
  const { article } = document;

  if (page.kind === 'cover') {
    return sNode('div', {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        paddingTop: 96,
        paddingBottom: 96,
        paddingLeft: 48,
        paddingRight: 48,
        fontFamily: READER_FONT_FAMILY,
      },
    },
    sNode('div', { style: { display: 'flex', fontSize: 53, fontWeight: 800, lineHeight: 1.2, color: '#2E2E34', marginBottom: 48 } }, article.title),
    sNode('div', { style: { display: 'flex', fontWeight: 600, fontSize: 24, color: '#6C6C73', letterSpacing: 1 } }, article.author.toUpperCase()),
    );
  }

  const activeHeading = extractFirstHeading(page.markdown);

  return sNode('div', {
    style: {
      display: 'flex',
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      fontFamily: READER_FONT_FAMILY,
    },
  },
  // Header — 120px, matches original .page-header
  sNode('div', {
    style: {
      display: 'flex',
      width: '100%',
      height: 120,
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingLeft: 24,
      paddingRight: 24,
      gap: 3,
      overflow: 'hidden',
    },
  },
    sNode('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
      sNode('div', { style: { display: 'flex', fontWeight: 600, fontSize: 21, color: '#6C6C73', lineHeight: 1.2857 } }, article.author),
      activeHeading
        ? sNode('div', { style: { display: 'flex', fontSize: 18, fontWeight: 400, color: '#2E2E34', maxWidth: 432, overflow: 'hidden' } }, `Đang đọc: ${activeHeading}`)
        : null,
    ),
    sNode('div', { style: { display: 'flex', fontWeight: 800, fontSize: 24, color: '#6C6C73', lineHeight: 1.25, marginTop: 4 } }, article.title),
  ),
  // Content box — matches original .page (border, radius, padding, color)
  sNode('div', {
    style: {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      marginLeft: 24,
      marginRight: 24,
      padding: 24,
      border: '2px solid rgba(151, 151, 159, 0.28)',
      borderRadius: 12,
      overflow: 'hidden',
      fontSize: 24,
      fontWeight: 500,
      lineHeight: 1.375,
      color: '#6C6C73',
      backgroundColor: '#ffffff',
    },
  },
    renderMarkdown(page.markdown, origin),
  ),
  // Footer — 96px, matches original .page-footer
  sNode('div', {
    style: {
      display: 'flex',
      width: '100%',
      height: 96,
      alignItems: 'center',
      paddingLeft: 24,
      paddingRight: 24,
    },
  },
    sNode('div', { style: { display: 'flex', alignItems: 'center', color: '#595961', fontSize: 21 } },
      sNode('div', { style: { display: 'flex', width: 14, height: 14, backgroundColor: '#6C6C73', borderRadius: 7, marginRight: 8, flexShrink: 0 } }),
      String(page.pageNumber),
    ),
  ),
  );
}

function getOriginFromHeaders(headers: Headers): string {
  const explicitOrigin = headers.get('origin');
  if (explicitOrigin) return explicitOrigin;

  const forwardedProto = headers.get('x-forwarded-proto') ?? 'http';
  const forwardedHost = headers.get('x-forwarded-host');
  const host = forwardedHost ?? headers.get('host');
  if (host) return `${forwardedProto}://${host}`;

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export async function getReaderDocument(slug: string): Promise<ReaderDocument | null> {
  const article = await getArticleReaderBySlug(slug);
  if (!article || article.status !== 'published') {
    return null;
  }

  const updatedAt = article.updatedAt.toISOString();
  const cached = readerDocCache.get(slug);
  if (cached && cached.updatedAt === updatedAt) {
    return cached.data;
  }

  const document = buildReaderDocument(article);
  readerDocCache.set(slug, { updatedAt, data: document });
  return document;
}

export async function renderReaderPageSvg(
  slug: string,
  pageNumber: number,
  headers: Headers,
): Promise<string | null> {
  const document = await getReaderDocument(slug);
  if (!document) return null;

  const page = document.descriptors.find((entry) => entry.pageNumber === pageNumber);
  if (!page) return null;

  const fonts = await loadFonts();
  const svg = await satori(
    renderPageShell(document, page, getOriginFromHeaders(headers)) as Parameters<typeof satori>[0],
    {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      fonts,
    },
  );

  return svg;
}