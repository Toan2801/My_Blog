/**
 * migrate-html-to-markdown.ts — Audit and migrate article source content.
 *
 * Converts each PostgreSQL Article row's `content` field from HTML to Markdown
 * so the source data stays markdown going forward. For published articles, the
 * script re-rasterizes page assets after a successful write unless explicitly
 * disabled.
 *
 * Usage:
 *   npx tsx scripts/migrate-html-to-markdown.ts                 # migrate all HTML rows
 *   npx tsx scripts/migrate-html-to-markdown.ts --slug=abc      # migrate one row
 *   npx tsx scripts/migrate-html-to-markdown.ts --dry-run       # audit only
 *   npx tsx scripts/migrate-html-to-markdown.ts --skip-rasterize
 */

import { config } from 'dotenv';
import TurndownService from 'turndown';
import { isLikelyHtml } from '../src/lib/markdown';
import { rasterizeArticle } from '../src/lib/rasterize';

config({ path: '.env.local' });

/** Pre-process raw HTML to flatten constructs Turndown can't carry natively. */
function preprocessHtml(html: string): string {
  let out = html;

  // Flatten image wrappers into plain image + italic caption blocks so
  // Turndown emits `![alt](src)` plus an italic line immediately below it.
  out = out.replace(
    /<div class="resizable-image-parent[^"]*"([^>]*)>([\s\S]*?)<\/div><\/div>/g,
    (_full, parentAttrs, inner) => {
      const imgMatch = (inner as string).match(/<img\b([^>]*)>/i);
      if (!imgMatch) return '';

      const imgAttrs = imgMatch[1];
      const srcM = imgAttrs.match(/\bsrc=("([^"]*)"|'([^']*)')/);
      const altM = imgAttrs.match(/\balt=("([^"]*)"|'([^']*)')/);
      const src = srcM ? (srcM[2] ?? srcM[3] ?? '') : '';
      const alt = altM ? (altM[2] ?? altM[3] ?? '') : '';

      const dataCapM = (parentAttrs as string).match(/data-caption=("([^"]*)"|'([^']*)')/);
      let caption = dataCapM ? (dataCapM[2] ?? dataCapM[3] ?? '') : '';
      if (!caption) {
        const inCapM = (inner as string).match(/<div class="image-caption"[^>]*>([\s\S]*?)<\/div>/);
        if (inCapM) caption = inCapM[1].replace(/<[^>]+>/g, '').trim();
      }

      if (!src && !caption) return '';

      const imgTag = `<img alt="${escapeAttr(alt)}" src="${escapeAttr(src)}" />`;
      const captionPart = caption.trim()
        ? `<p><em>${escapeText(caption.trim())}</em></p>`
        : '';
      return `<p>${imgTag}</p>${captionPart}`;
    },
  );

  // Drop hidden placeholder spans.
  out = out.replace(/<span[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>[\s\S]*?<\/span>/g, '');

  return out;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '_',
    br: '  ',
  });

  td.addRule('strikethrough', {
    filter: ['s', 'del'],
    replacement: (content) => `~~${content}~~`,
  });
  td.addRule('underline', {
    filter: ['u'],
    replacement: (content) => `_${content}_`,
  });
  td.addRule('stripSpan', {
    filter: 'span',
    replacement: (content) => content,
  });
  td.addRule('stripDiv', {
    filter: 'div',
    replacement: (content) => content,
  });

  return td;
}

function htmlToMarkdown(html: string, td: TurndownService): string {
  const preprocessed = preprocessHtml(html);
  let markdown = td.turndown(preprocessed);
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
  return markdown;
}

function computeReadingTime(text: string): number {
  const words = text.replace(/[#>*`_~\-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function main() {
  const { default: prisma } = await import('../src/lib/prisma');
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  const skipRasterize = args.includes('--skip-rasterize');

  const articles = await prisma.article.findMany({
    where: slugArg ? { slug: slugArg } : undefined,
    select: {
      slug: true,
      title: true,
      author: true,
      status: true,
      content: true,
    },
    orderBy: { slug: 'asc' },
  });

  if (articles.length === 0) {
    console.log(slugArg ? `Không tìm thấy bài viết: ${slugArg}` : 'Không có bài viết nào để kiểm tra.');
    await prisma.$disconnect();
    process.exit(0);
  }

  const td = createTurndown();
  let updated = 0;
  let alreadyMarkdown = 0;
  let skipped = 0;
  let rerasterized = 0;
  let rasterizeFailures = 0;

  try {
    for (const article of articles) {
      const original = article.content ?? '';

      if (!isLikelyHtml(original)) {
        alreadyMarkdown++;
        console.log(`  · ${article.slug} — already markdown, skip`);
        continue;
      }

      const markdown = htmlToMarkdown(original, td);
      if (!markdown) {
        skipped++;
        console.log(`  ! ${article.slug} — converted to empty markdown; skipping`);
        continue;
      }

      if (!dryRun) {
        await prisma.article.update({
          where: { slug: article.slug },
          data: {
            content: markdown,
            readingTime: computeReadingTime(markdown),
          },
          select: { slug: true },
        });

        if (!skipRasterize && article.status === 'published') {
          try {
            await rasterizeArticle(article.slug, markdown, article.title, article.author ?? '');
            await prisma.article.update({
              where: { slug: article.slug },
              data: { rasterizedAt: new Date() },
              select: { slug: true },
            });
            rerasterized++;
          } catch (error) {
            rasterizeFailures++;
            console.error(`  ⚠ ${article.slug} — migrated but rasterize failed: ${String(error)}`);
          }
        }
      }

      updated++;
      const actionLabel = dryRun ? '(dry)' : '✓';
      console.log(`  ${actionLabel} ${article.slug} — ${original.length} chars HTML → ${markdown.length} chars markdown`);
    }

    const summary = dryRun ? 'Would migrate' : 'Migrated';
    console.log(`\n${summary} ${updated} article(s). Already markdown: ${alreadyMarkdown}. Skipped: ${skipped}.`);
    if (!dryRun && !skipRasterize) {
      console.log(`Re-rasterized published articles: ${rerasterized}. Rasterize failures: ${rasterizeFailures}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});