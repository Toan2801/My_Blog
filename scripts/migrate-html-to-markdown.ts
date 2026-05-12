/**
 * migrate-html-to-markdown.ts — One-shot data migration.
 *
 * Converts each article's `content` field from HTML to Markdown so the source
 * data is markdown going forward. The rasterizer will then convert markdown
 * back to HTML at render time.
 *
 * Conventions chosen (decisions captured in docs/migration-html-to-markdown.md):
 *   - Image captions:   sibling `*caption*` line under `![alt](src)`
 *   - Image width:      dropped — single default rendering
 *   - <br> line break:  trailing two-space soft break (CommonMark)
 *   - <code> & <em>:    already present (from content-markup migration) →
 *                       become backticks and `_…_` via Turndown
 *   - Hidden spans:     dropped
 *
 * Usage:
 *   npx tsx scripts/migrate-html-to-markdown.ts                 # all articles
 *   npx tsx scripts/migrate-html-to-markdown.ts --slug=abc      # single
 *   npx tsx scripts/migrate-html-to-markdown.ts --dry-run       # preview
 */

import fs from 'fs';
import path from 'path';
import TurndownService from 'turndown';

const ARTICLES_DIR = path.join(process.cwd(), 'data', 'articles');

/** Pre-process raw HTML to flatten constructs Turndown can't carry natively. */
function preprocessHtml(html: string): string {
  let out = html;

  // 1. Image blocks: replace the wrapping div with a flat
  //    `<p><img alt="" src=""></p><p><em>caption</em></p>` sequence so
  //    Turndown emits `![alt](src)` followed by an italic caption line.
  out = out.replace(
    /<div class="resizable-image-parent[^"]*"([^>]*)>([\s\S]*?)<\/div><\/div>/g,
    (_full, parentAttrs, inner) => {
      // Skip empty image blocks entirely (no src + no caption).
      const imgMatch = (inner as string).match(/<img\b([^>]*)>/i);
      if (!imgMatch) return '';
      const imgAttrs = imgMatch[1];
      const srcM = imgAttrs.match(/\bsrc=("([^"]*)"|'([^']*)')/);
      const altM = imgAttrs.match(/\balt=("([^"]*)"|'([^']*)')/);
      const src = srcM ? (srcM[2] ?? srcM[3] ?? '') : '';
      const alt = altM ? (altM[2] ?? altM[3] ?? '') : '';

      // Caption: prefer the parent's data-caption, fall back to inner div text.
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

  // 2. Drop hidden placeholder spans (`<span style="display:none">…</span>`).
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
    br: '  ', // two-space CommonMark soft break
  });
  td.addRule('strikethrough', {
    filter: ['s', 'del'],
    replacement: (c) => `~~${c}~~`,
  });
  td.addRule('underline', {
    filter: ['u'],
    replacement: (c) => `_${c}_`,
  });
  // Strip leftover inline-style spans, keep their text.
  td.addRule('stripSpan', {
    filter: 'span',
    replacement: (c) => c,
  });
  // Strip outer divs that aren't image wrappers (they get flattened to children).
  td.addRule('stripDiv', {
    filter: 'div',
    replacement: (c) => c,
  });
  return td;
}

function htmlToMarkdown(html: string, td: TurndownService): string {
  const pre = preprocessHtml(html);
  let md = td.turndown(pre);
  // Collapse excessive blank lines (Turndown sometimes produces 3+).
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error('data/articles/ not found.');
    process.exit(1);
  }

  const td = createTurndown();
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));
  let updated = 0;
  let alreadyMarkdown = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (slugArg && data.slug !== slugArg) continue;

    const original: string = data.content ?? '';

    // Heuristic: if content has no HTML tags, treat as already migrated.
    if (!/<[a-z][\s\S]*?>/i.test(original)) {
      alreadyMarkdown++;
      console.log(`  · ${data.slug} — already markdown, skip`);
      continue;
    }

    const md = htmlToMarkdown(original, td);
    if (!md) {
      skipped++;
      console.log(`  ! ${data.slug} — converted to empty markdown; skipping`);
      continue;
    }

    data.content = md;
    if (!dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    updated++;
    console.log(`  ${dryRun ? '(dry)' : '✓'} ${data.slug} — ${original.length} chars HTML → ${md.length} chars markdown`);
  }

  console.log(`\n${dryRun ? 'Would migrate' : 'Migrated'} ${updated} article(s). Already markdown: ${alreadyMarkdown}. Skipped: ${skipped}.`);
}

main();
