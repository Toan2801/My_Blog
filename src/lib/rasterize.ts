/**
 * rasterize.ts — Server-side article rasterization using Puppeteer.
 *
 * Visually paginates article HTML into 3:4 portrait pages,
 * then screenshots each page to a PNG file on disk.
 *
 * Used by: scripts/migrate.ts, scripts/rasterize-articles.ts
 * NOT imported by Next.js runtime code (Puppeteer is devDependency only).
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import { renderArticleMarkdown, isLikelyHtml } from './markdown';
import { writeRasterizedArticleData } from './raster-data';

// Root typography and page sizing (rem -> px). Images are rendered at 2x DPR.
const ROOT_FONT_SIZE = 24; // 1rem = 16px
const PAGE_WIDTH_REM = 32;
const PAGE_HEIGHT_REM = 48;
// Gap between the page edge and the bordered content frame.
const MARGIN_X_REM = 1;
const PAD_X_REM = 1;
const PAD_Y_REM = 1;
const HEADER_HEIGHT_REM = 5;
const FOOTER_HEIGHT_REM = 4;
const CONTENT_AREA_WIDTH_REM = PAGE_WIDTH_REM - MARGIN_X_REM * 2; // 28
const CONTENT_AREA_HEIGHT_REM = PAGE_HEIGHT_REM - HEADER_HEIGHT_REM - FOOTER_HEIGHT_REM; // 36
const BORDER_WIDTH_PX = 2;

const PAGE_WIDTH = PAGE_WIDTH_REM * ROOT_FONT_SIZE; // 768px
const PAGE_HEIGHT = PAGE_HEIGHT_REM * ROOT_FONT_SIZE; // 1152px
const PAD_Y = PAD_Y_REM * ROOT_FONT_SIZE; // 96px
// Available height for text inside the bordered, padded content area.
const CONTENT_HEIGHT =
  CONTENT_AREA_HEIGHT_REM * ROOT_FONT_SIZE - PAD_Y * 2 - BORDER_WIDTH_PX * 2;
const DPR = 1;

// Page images are stored outside /public so they cannot be hot-linked or
// scraped directly. They are streamed through a token-gated API route.
const OUTPUT_DIR = path.join(process.cwd(), 'storage', 'page-images');

/** CSS applied to every rendered page (must match reader appearance). */
const PAGE_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

html {
  font-size: ${ROOT_FONT_SIZE}px;
}

body {
  margin: 0;
  padding: 0;
  background: #fff;
  -webkit-font-smoothing: antialiased;
}

.page-shell {
  width: ${PAGE_WIDTH_REM}rem;
  height: ${PAGE_HEIGHT_REM}rem;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.page-header {
  width: ${PAGE_WIDTH_REM}rem;
  height: ${HEADER_HEIGHT_REM}rem;
  padding: 0 ${MARGIN_X_REM}rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.125rem;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: #fff;
  overflow: hidden;
}

.page-header .header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-header .header-author {
  font-weight: 600;
  font-size: 0.875rem;
  color: #6C6C73;
  line-height: 1.2857;
}

.page-header .header-chip {
  font-size: 0.75rem;
  font-weight: 400;
  color: #2E2E34;
  max-width: 18rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-header h3.header-title {
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 800;
  font-size: 1rem;
  color: #6C6C73;
  margin-bottom: 0;
  margin-top: 0.25rem;
  padding: 0;
  border: none;
  line-height: 1.25;
}

.page {
  width: ${CONTENT_AREA_WIDTH_REM}rem;
  height: ${CONTENT_AREA_HEIGHT_REM}rem;
  margin: 0 ${MARGIN_X_REM}rem;
  padding: ${PAD_Y_REM}rem ${PAD_X_REM}rem;
  border: ${BORDER_WIDTH_PX}px solid #97979F47;
  border-radius: 0.5rem;
  box-sizing: border-box;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.375rem;
  color: #6C6C73;
  background: #fff;
  overflow: hidden;
  position: relative;
}

.page--image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.page--image img {
  height: auto;
  max-height: 24rem;
  max-width: 100%;
}

.image-caption {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 0.9rem;
  color: rgb(44, 26, 14);
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 2px solid rgb(160, 120, 58);
  text-align: center;
  width: 60%;
}

.page-footer {
  width: ${PAGE_WIDTH_REM}rem;
  height: ${FOOTER_HEIGHT_REM}rem;
  padding: 0 ${MARGIN_X_REM}rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 0.875rem;
  background: #fff;
}

.page-footer .footer-page {
  display: flex;
  align-items: center;
  color: #595961;
  font-size: 0.875rem;
}

.page-footer .footer-page .page-dot {
  width: 0.875rem;
  height: 0.875rem;
  background: #6C6C73;
  border-radius: 50%;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.page-footer .footer-heading {
  display: flex;
  align-items: center;
  background: #F2F2F4;
  border-radius: 0.5rem;
  padding: 0.35rem 0.75rem;
  color: #2E2E34;
  font-weight: 600;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Measurement container (no fixed height, used for block measurement) */
.measure {
  width: ${CONTENT_AREA_WIDTH_REM}rem;
  padding: 0 ${PAD_X_REM}rem;
  box-sizing: border-box;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.375rem;
  color: #2E2E34;
  background: #fff;
}

h1, h2, h3 {
  font-family: 'Times New Roman', serif;
  font-weight: bold;
  margin-top: 1.4em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}
h1 { font-size: 1.6rem; }
h2 {
  font-size: 1.35rem;
  padding-top: 0.6em;
  border-top: 1px solid #ddd;
}
h3 { font-size: 1.15rem; }

p {
  text-align: justify;
  margin-bottom: 0.6em;
}

blockquote {
  margin: 0.2rem 0;
  border-left: 0.3rem solid #c5c7cc;
  color: #6C6C73;
  background: transparent;
  padding: 0 0.7rem 0 1rem;
}

img {
  max-width: 100%;
  width: auto;
  height: 4rem;
  margin: 0.8em auto;
  display: block;
  object-fit: contain;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2em 0;
  font-size: 0.88rem;
}
th, td {
  border: 1px solid #ddd;
  padding: 6px 10px;
}

ul, ol {
  margin: 0.8em 0;
  padding-left: 1.5em;
}
li { margin-bottom: 0.3em; }

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 1.5em 0;
}

code {
  display: inline;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  margin: -0.2rem 0;
  padding: 0 0.2rem;
  background: #5970F20A;
  border: 1px solid #97979F5C;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* ── Cover, blank, TOC, back-cover special pages ─────────────────── */
.cover-page {
  width: ${PAGE_WIDTH_REM}rem;
  height: ${PAGE_HEIGHT_REM}rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  box-sizing: border-box;
  background: #fff;
}
.cover-page .cover-title {
  font-family: 'Times New Roman', serif;
  font-weight: 800;
  font-size: 2.2rem;
  line-height: 1.2;
  color: #2E2E34;
  margin-bottom: 2rem;
}
.cover-page .cover-author {
  font-weight: 600;
  font-size: 1rem;
  color: #6C6C73;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.blank-page {
  width: ${PAGE_WIDTH_REM}rem;
  height: ${PAGE_HEIGHT_REM}rem;
  background: #fff;
}

.page--toc {
  overflow: hidden;
}
.page--toc h2.toc-title {
  font-family: 'Times New Roman', serif;
  font-weight: bold;
  font-size: 1.6rem;
  border-top: none;
  padding-top: 0;
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: center;
  color: #2E2E34;
}
.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.toc-list li {
  display: flex;
  align-items: baseline;
  font-size: 0.95rem;
  line-height: 1.4;
  margin-bottom: 0.3rem;
  color: #2E2E34;
}
.toc-list li.toc-h1 { font-weight: 700; padding-left: 0; }
.toc-list li.toc-h2 { font-weight: 500; padding-left: 1rem; }
.toc-list li.toc-h3 { font-weight: 400; padding-left: 2rem; color: #6C6C73; }
.toc-list .toc-text { flex: 1; }
.toc-list .toc-dots {
  flex: 1;
  border-bottom: 1px dotted #97979F;
  margin: 0 0.4rem;
  transform: translateY(-0.25rem);
}
.toc-list .toc-page-num { color: #6C6C73; }

.back-page {
  width: ${PAGE_WIDTH_REM}rem;
  height: ${PAGE_HEIGHT_REM}rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  box-sizing: border-box;
  background: #fff;
  gap: 1.2rem;
}
.back-page .back-title {
  font-family: 'Times New Roman', serif;
  font-weight: bold;
  font-size: 1.5rem;
  color: #2E2E34;
}
.back-page .back-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #2E2E34;
  max-width: 24rem;
  font-style: italic;
}
.back-page .back-qr {
  width: 12rem;
  height: 12rem;
  object-fit: contain;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  margin: 0;
  display: block;
}
.back-page .back-footer-note {
  font-size: 0.8rem;
  color: #6C6C73;
}

/* Page number now lives in .page-footer outside content area. */
`;

export interface PageInfo {
  pageNumber: number;
  imageUrl: string;
}

export interface MarkdownPageInfo {
  pageNumber: number;
  markdown: string;
}

export interface RasterizeResult {
  pages: PageInfo[];
  markdownPages: MarkdownPageInfo[];
}

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '_',
  });
  td.addRule('strikethrough', {
    filter: ['s', 'del'],
    replacement: (c) => `~~${c}~~`,
  });
  td.addRule('table', {
    filter: 'table',
    replacement: (_c, node) => {
      const el = node as HTMLElement;
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length === 0) return '';
      const cellText = (cell: Element) =>
        (cell.textContent || '').replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
      const lines: string[] = [];
      rows.forEach((row, i) => {
        const cells = Array.from(row.querySelectorAll('th,td')).map(cellText);
        lines.push(`| ${cells.join(' | ')} |`);
        if (i === 0) lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
      });
      return `\n\n${lines.join('\n')}\n\n`;
    },
  });
  return td;
}

/**
 * Rasterize an article's HTML content into 3:4 page images AND per-page markdown.
 *
 * 1. Renders the full HTML in Puppeteer to measure block positions.
 * 2. Splits blocks into pages that fit within CONTENT_HEIGHT.
 * 3. Screenshots each page at 2× DPR and saves to data/page-images/{slug}/.
 * 4. Converts the SAME per-page HTML blocks to markdown, so search indices
 *    line up exactly with rendered pages.
 *
 * @returns Pages (image metadata) and markdownPages (per-page markdown).
 */
/** Pull the first heading's text out of a block's outerHTML. Returns null if the block isn't a heading. */
function extractHeadingText(html: string): string | null {
  const m = html.match(/^<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || null;
}

/** Strip Vietnamese (and other Latin) diacritics so the header looks consistent across articles. */
function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Read an asset from /public/uploads and return a data: URL for puppeteer embedding. */
function loadAssetDataUrl(relPath: string): string | null {
  try {
    const full = path.join(process.cwd(), 'public', relPath.replace(/^\/+/, ''));
    if (!fs.existsSync(full)) return null;
    const buf = fs.readFileSync(full);
    const ext = path.extname(full).slice(1).toLowerCase();
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function rasterizeArticle(
  slug: string,
  content: string,
  title: string = '',
  author: string = '',
): Promise<RasterizeResult> {
  // The source of truth is now markdown. Convert to HTML up-front; if the
  // input still has HTML tags (un-migrated legacy data), use it as-is.
  const htmlContent = isLikelyHtml(content)
    ? content
    : renderArticleMarkdown(content);

  // Ensure output directory exists
  const slugDir = path.join(OUTPUT_DIR, slug);
  fs.mkdirSync(slugDir, { recursive: true });

  // Clean old page images
  const existing = fs.readdirSync(slugDir).filter(f => f.startsWith('page-') && f.endsWith('.png'));
  for (const f of existing) fs.unlinkSync(path.join(slugDir, f));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // tsx/esbuild wraps function expressions in page.evaluate bodies with calls
    // to a `__name` helper (the `keepNames` transform). That helper exists in
    // Node but not in the browser, so without this polyfill page.evaluate
    // throws ReferenceError: __name is not defined. Inject it into every
    // document this page loads.
    const NAME_POLYFILL = '<script>window.__name=function(f){return f};</script>';

    // ── Step 1: Measure block element positions ──────────────────────
    await page.setViewport({ width: PAGE_WIDTH, height: 10000, deviceScaleFactor: DPR });

    await page.setContent(`<!DOCTYPE html>
<html><head>${NAME_POLYFILL}<meta charset="utf-8"><style>${PAGE_CSS}</style></head>
<body><div class="measure">${htmlContent}</div></body></html>`, {
      waitUntil: 'domcontentloaded',
    });

    // Brief wait for layout
    await new Promise(r => setTimeout(r, 200));

    // ── Step 2: Pack blocks into pages with mid-paragraph splitting ──
    // Constraints:
    //   - Force a page break before every <h1>/<h2>/<h3>.
    //   - Every block containing an <img> gets its own page (image + caption).
    //   - Paragraphs that overflow are split at the latest sentence boundary
    //     that still fits; if no sentence boundary is available in the fitting
    //     range, fall back to the latest word boundary (never split a word).
    const paginated = await page.evaluate((CONTENT_HEIGHT) => {
      const container = document.querySelector('.measure') as HTMLElement | null;
      if (!container) return [] as Array<{ kind: 'normal' | 'image'; blocks: string[] }>;

      // Hidden measurement root with the same width/style as .measure
      const measureRoot = document.createElement('div');
      measureRoot.className = 'measure';
      measureRoot.style.position = 'absolute';
      measureRoot.style.visibility = 'hidden';
      measureRoot.style.left = '-99999px';
      measureRoot.style.top = '0';
      document.body.appendChild(measureRoot);

      const measure = (html: string): number => {
        measureRoot.innerHTML = html;
        return measureRoot.offsetHeight;
      };

      const pages: Array<{ kind: 'normal' | 'image'; blocks: string[] }> = [];
      let current: string[] = [];

      const commit = (kind: 'normal' | 'image' = 'normal') => {
        if (current.length > 0) {
          pages.push({ kind, blocks: current });
          current = [];
        }
      };

      const fitsWith = (html: string): boolean => {
        if (current.length === 0) return true;
        return measure(current.join('') + html) <= CONTENT_HEIGHT;
      };

      // Tokenize paragraph innerHTML into atomic units: inline elements stay whole;
      // text content is split into word-tokens. This preserves <code>/<em>/<a> etc.
      // when a paragraph is split across pages.
      const INLINE_TAGS = 'code|em|strong|i|b|u|s|del|mark|a|sub|sup|small|kbd|span';
      const TOKEN_RE = new RegExp(
        `<(?:${INLINE_TAGS})\\b[^>]*>[\\s\\S]*?</(?:${INLINE_TAGS})>|<br\\s*/?>|\\S+\\s*|\\s+`,
        'gi'
      );

      const tokenize = (html: string): string[] => {
        const toks: string[] = [];
        let m: RegExpExecArray | null;
        TOKEN_RE.lastIndex = 0;
        while ((m = TOKEN_RE.exec(html)) !== null) toks.push(m[0]);
        return toks;
      };

      // True if a token ends a sentence (only word tokens count, not inline atoms).
      const isSentenceEnd = (tok: string): boolean => {
        if (tok.startsWith('<')) return false;
        return /[.!?…](["')\]]*)\s*$/.test(tok);
      };

      // Greedily find the longest prefix of tokens whose <p> rendering
      // (added to the current page) still fits CONTENT_HEIGHT, ending at the
      // nearest sentence boundary (preferred) or word boundary.
      const splitParagraph = (
        paragraphHtml: string,
      ): { fit: string | null; rest: string } => {
        const tokens = tokenize(paragraphHtml);
        if (tokens.length === 0) return { fit: null, rest: '' };

        // Quick test: whole paragraph fits?
        if (measure(current.join('') + '<p>' + paragraphHtml + '</p>') <= CONTENT_HEIGHT) {
          return { fit: paragraphHtml, rest: '' };
        }

        // Binary search: max number of tokens whose <p> still fits.
        let lo = 0, hi = tokens.length, best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (mid === 0) { lo = mid + 1; continue; }
          const prefix = tokens.slice(0, mid).join('');
          const h = measure(current.join('') + '<p>' + prefix + '</p>');
          if (h <= CONTENT_HEIGHT) { best = mid; lo = mid + 1; }
          else { hi = mid - 1; }
        }

        if (best === 0) return { fit: null, rest: paragraphHtml };

        // Prefer the latest sentence boundary within the last 30% of the fitting prefix.
        const minBack = Math.max(1, Math.floor(best * 0.7));
        let splitAt = best;
        for (let i = best - 1; i >= minBack - 1; i--) {
          if (isSentenceEnd(tokens[i] || '')) {
            splitAt = i + 1;
            break;
          }
        }

        const fit = tokens.slice(0, splitAt).join('').replace(/^\s+|\s+$/g, '');
        const rest = tokens.slice(splitAt).join('').replace(/^\s+|\s+$/g, '');
        return { fit, rest };
      };

      const blocks = Array.from(container.children) as HTMLElement[];

      for (const block of blocks) {
        const tag = block.tagName.toLowerCase();
        const isHeading = /^h[1-3]$/.test(tag);
        const hasImg = block.querySelector('img') !== null;

        if (hasImg) {
          // Skip empty/broken image blocks: no src AND no caption text.
          const img = block.querySelector('img');
          const src = (img && img.getAttribute('src')) || '';
          const captionText = (block.textContent || '').trim();
          if (!src && !captionText) continue;

          // Image (with its caption inside the same block) on its own page.
          commit();
          current.push(block.outerHTML);
          commit('image');
          continue;
        }

        if (isHeading) {
          // Start a new page; the heading is the first block.
          commit();
          current.push(block.outerHTML);
          continue;
        }

        if (tag === 'p') {
          // Preserve inline tags (<code>, <em>, etc.) by working with innerHTML
          // rather than textContent.
          let remaining = (block.innerHTML || '').replace(/\s+/g, ' ').trim();
          if (!remaining) continue;

          // Loop, peeling off prefixes that fit on successive pages.
          // Safety bound: paragraphs > 200 splits indicate something is off.
          for (let safety = 0; safety < 200 && remaining; safety++) {
            const { fit, rest } = splitParagraph(remaining);
            if (fit) {
              current.push('<p>' + fit + '</p>');
              remaining = rest;
              if (remaining) commit();
            } else {
              // Nothing fits on a non-empty page — commit and retry on a fresh page.
              if (current.length === 0) {
                // Even on an empty page nothing fit; shove the rest in to avoid infinite loop.
                current.push('<p>' + remaining + '</p>');
                remaining = '';
              } else {
                commit();
              }
            }
          }
          continue;
        }

        // Other blocks (blockquote, ul, ol, table, hr, etc.): try atomic add.
        if (fitsWith(block.outerHTML)) {
          current.push(block.outerHTML);
        } else {
          commit();
          current.push(block.outerHTML);
        }
      }
      commit();

      measureRoot.remove();
      return pages;
    }, CONTENT_HEIGHT);

    const pageBlocks: string[][] = paginated.map(p => p.blocks);
    const pageKinds: Array<'normal' | 'image'> = paginated.map(p => p.kind);

    if (pageBlocks.length === 0) {
      pageBlocks.push([htmlContent || '<p>&nbsp;</p>']);
      pageKinds.push('normal');
    }

    // Compute the active heading for each page: the nearest preceding (or
    // current-page) h1/h2/h3 text. Pages before any heading get an empty header.
    const pageHeadings: string[] = [];
    let activeHeading = '';
    for (const blocks of pageBlocks) {
      for (const block of blocks) {
        const h = extractHeadingText(block);
        if (h) activeHeading = h;
      }
      pageHeadings.push(activeHeading);
    }

    const headerAuthor = escapeHtml(author);
    const headerTitle = escapeHtml(stripDiacritics(title));

    // ── Step 3: Assemble final page list ─────────────────────────────
    // Layout: [cover, blank, toc, ...contentPages, (blank), (blank-filler), back]
    // Constraint 1: page immediately before back cover must be blank.
    // Constraint 2: total page count must be even.

    type RenderPage =
      | { kind: 'cover' }
      | { kind: 'blank' }
      | { kind: 'toc'; entries: Array<{ level: number; text: string; finalPage: number }> }
      | { kind: 'normal'; blocks: string[]; activeHeading: string }
      | { kind: 'image'; blocks: string[]; activeHeading: string }
      | { kind: 'back' };

    // Cover, blank, TOC occupy final pages 1, 2, 3. Content pages start at 4.
    const CONTENT_PAGE_OFFSET = 3;

    const tocEntries: Array<{ level: number; text: string; finalPage: number }> = [];
    for (let i = 0; i < pageBlocks.length; i++) {
      for (const block of pageBlocks[i]) {
        const m = block.match(/^<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/i);
        if (m) {
          tocEntries.push({
            level: parseInt(m[1], 10),
            text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
            finalPage: i + 1 + CONTENT_PAGE_OFFSET,
          });
        }
      }
    }

    const finalPages: RenderPage[] = [
      { kind: 'cover' },
      { kind: 'blank' },
      { kind: 'toc', entries: tocEntries },
      ...pageBlocks.map((blocks, i): RenderPage => ({
        kind: pageKinds[i],
        blocks,
        activeHeading: pageHeadings[i] || '',
      })),
    ];
    // Ensure the page immediately before the back cover is blank.
    if (finalPages[finalPages.length - 1].kind !== 'blank') {
      finalPages.push({ kind: 'blank' });
    }
    // Ensure total (with back cover appended) is even — i.e., pre-back length odd.
    if (finalPages.length % 2 === 0) {
      finalPages.push({ kind: 'blank' });
    }
    finalPages.push({ kind: 'back' });

    // Load donation assets once.
    const qrDataUrl = loadAssetDataUrl('/uploads/qr-1775885889862.png');
    const escTitle = escapeHtml(title);
    const escAuthor = escapeHtml(author);

    const renderHeader = (activeHeading: string): string => {
      const chip = escapeHtml(activeHeading);
      return `<div class="page-header">
    <div class="header-row">
      <div class="header-author">${headerAuthor}</div>
      ${chip ? `<div class="header-chip">Đang đọc: ${chip}</div>` : ''}
    </div>
    <h3 class="header-title">${headerTitle}</h3>
  </div>`;
    };

    const renderFooter = (pageNum: number): string =>
      `<div class="page-footer">
    <div class="footer-page">
      <span class="page-dot"></span>
      <span class="page-num">${pageNum}</span>
    </div>
  </div>`;

    const renderBody = (rp: RenderPage, pageNum: number): string => {
      switch (rp.kind) {
        case 'cover':
          return `<div class="cover-page">
    <div class="cover-title">${escTitle}</div>
    <div class="cover-author">${escAuthor}</div>
  </div>`;
        case 'blank':
          return `<div class="blank-page"></div>`;
        case 'toc': {
          const items = rp.entries.map(e => {
            const cls = `toc-h${e.level}`;
            return `<li class="${cls}"><span class="toc-text">${escapeHtml(e.text)}</span><span class="toc-dots"></span><span class="toc-page-num">${e.finalPage}</span></li>`;
          }).join('');
          return `${renderHeader('')}
  <div class="page page--toc">
    <h2 class="toc-title">Mục lục</h2>
    <ol class="toc-list">${items}</ol>
  </div>
  ${renderFooter(pageNum)}`;
        }
        case 'normal':
        case 'image': {
          const pageClass = rp.kind === 'image' ? 'page page--image' : 'page';
          return `${renderHeader(rp.activeHeading)}
  <div class="${pageClass}">
    ${rp.blocks.join('\n')}
  </div>
  ${renderFooter(pageNum)}`;
        }
        case 'back':
          return `<div class="back-page">
    <div class="back-title">Hỡi các bạn độc giả yêu quý!</div>
    <div class="back-text">Việc viết và dịch bài rất tốn thời gian và công sức. Nếu các bạn đọc thấy hay, xin vui lòng quét mã QR này tặng mình 1 li cafe để mình có động lực thức khuya viết tiếp phục vụ các bạn. Xin chân thành cảm ơn mọi người ạ.</div>
    ${qrDataUrl ? `<img class="back-qr" src="${qrDataUrl}" alt="QR ủng hộ" />` : ''}
    <div class="back-footer-note">Cảm ơn bạn đã đọc tới cuối sách.</div>
  </div>`;
      }
    };

    // ── Step 4: Render each final page to PNG ────────────────────────
    const results: PageInfo[] = [];

    for (let i = 0; i < finalPages.length; i++) {
      const pageNum = i + 1;
      const body = renderBody(finalPages[i], pageNum);

      await page.setViewport({ width: PAGE_WIDTH, height: PAGE_HEIGHT, deviceScaleFactor: DPR });

      await page.setContent(`<!DOCTYPE html>
<html><head>${NAME_POLYFILL}<meta charset="utf-8"><style>${PAGE_CSS}</style></head>
<body>
<div class="page-shell">
  ${body}
</div>
</body></html>`, {
        waitUntil: 'domcontentloaded',
      });

      await new Promise(r => setTimeout(r, 100));

      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT },
      });

      const imgPath = path.join(slugDir, `page-${pageNum}.png`);
      fs.writeFileSync(imgPath, screenshot);

      results.push({
        pageNumber: pageNum,
        imageUrl: `/api/articles/${slug}/page/${pageNum}/image`,
      });
    }

    // ── Step 5: Per-page markdown (for search) ───────────────────────
    const turndown = createTurndown();
    const markdownPages: MarkdownPageInfo[] = finalPages.map((rp, i): MarkdownPageInfo => {
      const pageNumber = i + 1;
      let md = '';
      try {
        switch (rp.kind) {
          case 'cover':
            md = `# ${title}\n\n${author}`;
            break;
          case 'blank':
          case 'back':
            md = '';
            break;
          case 'toc':
            md = `# Mục lục\n\n${rp.entries.map(e => `${'  '.repeat(e.level - 1)}- ${e.text} — ${e.finalPage}`).join('\n')}`;
            break;
          case 'normal':
          case 'image':
            md = turndown.turndown(rp.blocks.join('\n'));
            break;
        }
      } catch {
        md = '';
      }
      return { pageNumber, markdown: md };
    });

    await writeRasterizedArticleData(slug, { pages: results, markdownPages });
    return { pages: results, markdownPages };
  } finally {
    await browser.close();
  }
}
