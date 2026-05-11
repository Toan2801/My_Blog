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

// Root typography and page sizing (rem -> px). Images are rendered at 2x DPR.
const ROOT_FONT_SIZE = 24; // 1rem = 16px
const PAGE_WIDTH_REM = 32;
const PAGE_HEIGHT_REM = 48;
const PAD_X_REM = 2;
const PAD_Y_REM = 2;
const FOOTER_HEIGHT_REM = 2;

const PAGE_WIDTH = PAGE_WIDTH_REM * ROOT_FONT_SIZE; // 768px
const PAGE_HEIGHT = PAGE_HEIGHT_REM * ROOT_FONT_SIZE; // 1024px
const PAD_X = PAD_X_REM * ROOT_FONT_SIZE; // 64px
const PAD_Y = PAD_Y_REM * ROOT_FONT_SIZE; // 64px
const FOOTER_HEIGHT = FOOTER_HEIGHT_REM * ROOT_FONT_SIZE; // 64px
const CONTENT_HEIGHT = PAGE_HEIGHT - FOOTER_HEIGHT - PAD_Y * 2;
const DPR = 2;

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data', 'image', 'articles');

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

.page {
  width: ${PAGE_WIDTH_REM}rem;
  height: ${PAGE_HEIGHT_REM - FOOTER_HEIGHT_REM}rem;
  padding: ${PAD_Y_REM}rem ${PAD_X_REM}rem;
  box-sizing: border-box;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.375rem;
  color: #2d2d32;
  background: #fff;
  overflow: hidden;
  position: relative;
}

.page-footer {
  width: ${PAGE_WIDTH_REM}rem;
  height: ${FOOTER_HEIGHT_REM}rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 0.75rem;
  color: #777;
  background: #fff;
}

/* Measurement container (no fixed height, used for block measurement) */
.measure {
  width: ${PAGE_WIDTH_REM}rem;
  padding: 0 ${PAD_X_REM}rem;
  box-sizing: border-box;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.5rem;
  color: #2d2d32;
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
  margin-bottom: 1.2em;
  text-align: justify;
}

blockquote {
  border-left: 0.3rem solid #c5c7cc;
  color: #2d2d32;
  background: transparent;
  padding: 0 0.7rem 0 1rem;
  font-style: italic;
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

/* Page number now lives in .page-footer outside content area. */
`;

export interface PageInfo {
  pageNumber: number;
  imageUrl: string;
}

/**
 * Rasterize an article's HTML content into 3:4 page images.
 *
 * 1. Renders the full HTML in Puppeteer to measure block positions.
 * 2. Splits blocks into pages that fit within CONTENT_HEIGHT.
 * 3. Screenshots each page at 2× DPR.
 * 4. Saves PNGs to public/data/image/articles/{slug}/.
 *
 * @returns Array of page metadata (pageNumber + public imageUrl).
 */
export async function rasterizeArticle(
  slug: string,
  htmlContent: string,
  totalPageCount?: number,
): Promise<PageInfo[]> {
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

    // ── Step 1: Measure block element positions ──────────────────────
    await page.setViewport({ width: PAGE_WIDTH, height: 10000, deviceScaleFactor: DPR });

    await page.setContent(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${PAGE_CSS}</style></head>
<body><div class="measure">${htmlContent}</div></body></html>`, {
      waitUntil: 'domcontentloaded',
    });

    // Brief wait for layout
    await new Promise(r => setTimeout(r, 200));

    const blockData = await page.evaluate(() => {
      const container = document.querySelector('.measure');
      if (!container) return [];
      const children = Array.from(container.children) as HTMLElement[];
      return children.map(el => ({
        top: el.offsetTop,
        height: el.offsetHeight,
        html: el.outerHTML,
      }));
    });

    // ── Step 2: Split blocks into pages ──────────────────────────────
    // Use offsetTop-based height tracking so inter-block margins (e.g. paragraph
    // margin-bottom) are included. Summing offsetHeight alone misses those margins
    // and causes the last few lines of each page to overflow/clip.
    const pageBlocks: string[][] = [];
    let currentBlocks: string[] = [];
    let pageStartTop = 0; // offsetTop of the first block on the current page

    for (const block of blockData) {
      if (currentBlocks.length === 0) {
        // First block of this page — anchor the page start
        pageStartTop = block.top;
        currentBlocks.push(block.html);
      } else {
        // Rendered height from start of page to end of this block (includes margins)
        const renderedHeight = (block.top + block.height) - pageStartTop;
        if (renderedHeight > CONTENT_HEIGHT) {
          pageBlocks.push(currentBlocks);
          currentBlocks = [block.html];
          pageStartTop = block.top;
        } else {
          currentBlocks.push(block.html);
        }
      }
    }
    if (currentBlocks.length > 0) {
      pageBlocks.push(currentBlocks);
    }

    if (pageBlocks.length === 0) {
      pageBlocks.push([htmlContent || '<p>&nbsp;</p>']);
    }

    const effectiveTotal = totalPageCount ?? pageBlocks.length;

    // ── Step 3: Render each page to PNG ──────────────────────────────
    const results: PageInfo[] = [];

    for (let i = 0; i < pageBlocks.length; i++) {
      const pageNum = i + 1;
      const blocksHtml = pageBlocks[i].join('\n');

      await page.setViewport({ width: PAGE_WIDTH, height: PAGE_HEIGHT, deviceScaleFactor: DPR });

      await page.setContent(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${PAGE_CSS}</style></head>
<body>
<div class="page-shell">
  <div class="page">
    ${blocksHtml}
  </div>
  <div class="page-footer">Page ${pageNum} / ${effectiveTotal}</div>
</div>
</body></html>`, {
        waitUntil: 'domcontentloaded',
      });

      // Brief wait for layout
      await new Promise(r => setTimeout(r, 100));

      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT },
      });

      const imgPath = path.join(slugDir, `page-${pageNum}.png`);
      fs.writeFileSync(imgPath, screenshot);

      results.push({
        pageNumber: pageNum,
        imageUrl: `/data/image/articles/${slug}/page-${pageNum}.png`,
      });
    }

    return results;
  } finally {
    await browser.close();
  }
}
