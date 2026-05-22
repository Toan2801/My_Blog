/* eslint-disable */
import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import satori from 'satori';
import { getArticleReaderBySlug, type ReaderSourceArticle } from './data';
import type { ArticleMarkdownPage, ArticlePage } from './types';

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
      const vietnameseRegular = await readFirstExisting([
        path.join(process.cwd(), 'node_modules', '@fontsource', 'be-vietnam-pro', 'files', 'be-vietnam-pro-vietnamese-400-normal.woff'),
      ]);
      const latinRegular = await readFirstExisting([
        path.join(process.cwd(), 'node_modules', '@fontsource', 'be-vietnam-pro', 'files', 'be-vietnam-pro-latin-ext-400-normal.woff'),
        path.join(process.cwd(), 'node_modules', '@fontsource', 'be-vietnam-pro', 'files', 'be-vietnam-pro-latin-400-normal.woff'),
      ]);
      const vietnameseBold = await readFirstExisting([
        path.join(process.cwd(), 'node_modules', '@fontsource', 'be-vietnam-pro', 'files', 'be-vietnam-pro-vietnamese-600-normal.woff'),
      ]);
      const latinBold = await readFirstExisting([
        path.join(process.cwd(), 'node_modules', '@fontsource', 'be-vietnam-pro', 'files', 'be-vietnam-pro-latin-ext-600-normal.woff'),
        path.join(process.cwd(), 'node_modules', '@fontsource', 'be-vietnam-pro', 'files', 'be-vietnam-pro-latin-600-normal.woff'),
      ]);
      const hanFont = await readFirstExisting([
        path.join(process.cwd(), 'src', 'fonts', 'Jigmo.ttf'),
      ]);

      const fonts: SatoriFontOption[] = [];
      if (vietnameseRegular) {
        fonts.push({ name: 'Be Vietnam Pro', data: vietnameseRegular, weight: 400, style: 'normal' });
      }
      if (latinRegular) {
        fonts.push({ name: 'Be Vietnam Pro', data: latinRegular, weight: 400, style: 'normal' });
      }
      if (vietnameseBold) {
        fonts.push({ name: 'Be Vietnam Pro', data: vietnameseBold, weight: 600, style: 'normal' });
      }
      if (latinBold) {
        fonts.push({ name: 'Be Vietnam Pro', data: latinBold, weight: 600, style: 'normal' });
      }
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

function renderMarkdown(markdown: string, origin: string) {
  return sNode(ReactMarkdown, {
    remarkPlugins: [remarkGfm],
    components: {
      h1: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', fontSize: 34, fontWeight: 600, lineHeight: 1.25, marginBottom: 20, color: '#1f2937' },
      }, children),
      h2: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', fontSize: 28, fontWeight: 600, lineHeight: 1.3, marginBottom: 18, color: '#1f2937' },
      }, children),
      h3: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', fontSize: 24, fontWeight: 600, lineHeight: 1.3, marginBottom: 16, color: '#374151' },
      }, children),
      p: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', fontSize: 24, lineHeight: 1.7, marginBottom: 18, color: '#4b5563' },
      }, children),
      strong: ({ children }: { children?: unknown }) => sNode('span', {
        style: { fontWeight: 600, color: '#111827' },
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
        style: { display: 'flex', gap: 12, fontSize: 24, lineHeight: 1.6, color: '#4b5563' },
      },
      sNode('span', { style: { width: 18, color: '#915934' } }, '•'),
      sNode('span', { style: { flex: 1 } }, children)),
      blockquote: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', borderLeft: '6px solid #d1d5db', paddingLeft: 18, marginBottom: 18, color: '#374151' },
      }, children),
      code: ({ children }: { children?: unknown }) => sNode('span', {
        style: { fontFamily: 'Be Vietnam Pro', fontSize: 22, backgroundColor: '#f3f4f6', color: '#7c2d12', paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, borderRadius: 6 },
      }, children),
      pre: ({ children }: { children?: unknown }) => sNode('div', {
        style: { display: 'flex', marginBottom: 18, backgroundColor: '#f3f4f6', borderRadius: 16, padding: 20, color: '#1f2937' },
      }, children),
      hr: () => sNode('div', {
        style: { display: 'flex', width: '100%', height: 1, backgroundColor: '#e5e7eb', marginBottom: 18 },
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
  const coverImage = resolveAssetUrl(origin, article.coverImage);

  if (page.kind === 'cover') {
    return sNode('div', {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 56,
        color: '#111827',
        fontFamily: 'Be Vietnam Pro',
      },
    },
    sNode('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      sNode('div', { style: { display: 'flex', fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: '#915934' } }, article.author),
      sNode('div', { style: { display: 'flex', fontSize: 44, fontFamily: 'Jigmo', color: '#1f2937' } }, '经书大典'),
    ),
    sNode('div', { style: { display: 'flex', flex: 1, alignItems: 'center', gap: 40 } },
      sNode('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', gap: 24 } },
        sNode('div', { style: { display: 'flex', fontSize: 26, textTransform: 'uppercase', letterSpacing: 3, color: '#6b7280' } }, 'Đọc trực tuyến'),
        sNode('div', { style: { display: 'flex', fontSize: 58, fontWeight: 600, lineHeight: 1.1, color: '#111827' } }, article.title),
        sNode('div', { style: { display: 'flex', fontSize: 28, lineHeight: 1.6, color: '#4b5563' } }, article.excerpt || 'Phiên bản trình đọc theo yêu cầu.'),
      ),
      sNode('div', { style: { display: 'flex', width: 280, height: 420, alignItems: 'center', justifyContent: 'center', borderRadius: 32, border: '1px solid rgba(145, 89, 52, 0.18)', backgroundColor: '#ffffff', overflow: 'hidden' } },
        coverImage
          ? sNode('img', { src: coverImage, alt: article.title, style: { width: '100%', height: '100%', objectFit: 'cover' } })
          : sNode('div', { style: { display: 'flex', fontSize: 120, fontWeight: 600, color: '#cbd5e1' } }, article.title.slice(0, 1)),
      ),
    ),
    sNode('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, color: '#6b7280' } },
      sNode('div', { style: { display: 'flex' } }, article.date),
      sNode('div', { style: { display: 'flex' } }, `Trang 1 / ${document.totalPages}`),
    ));
  }

  return sNode('div', {
    style: {
      display: 'flex',
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      paddingTop: 42,
      paddingBottom: 36,
      paddingLeft: 52,
      paddingRight: 52,
      color: '#1f2937',
      fontFamily: 'Be Vietnam Pro',
    },
  },
  sNode('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26, fontSize: 21, color: '#6b7280' } },
    sNode('div', { style: { display: 'flex', fontWeight: 600 } }, article.author),
    sNode('div', { style: { display: 'flex', maxWidth: 360, textAlign: 'right' } }, article.title),
  ),
  sNode('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', border: '2px solid rgba(151, 151, 159, 0.28)', borderRadius: 24, paddingTop: 34, paddingBottom: 22, paddingLeft: 34, paddingRight: 34 } },
    renderMarkdown(page.markdown, origin),
  ),
  sNode('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, fontSize: 20, color: '#6b7280' } },
    sNode('div', { style: { display: 'flex' } }, article.date),
    sNode('div', { style: { display: 'flex' } }, `Trang ${page.pageNumber} / ${document.totalPages}`),
  ));
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