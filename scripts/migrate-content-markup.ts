/**
 * migrate-content-markup.ts — One-shot data migration.
 *
 * Converts quoted text to inline code, and italicizes blockquote contents,
 * in BOTH the HTML `content` field and every per-page entry in the
 * raster manifest stored under `storage/page-images/<slug>/manifest.json`.
 * Idempotent: re-running is a no-op.
 *
 * Usage:
 *   npx tsx scripts/migrate-content-markup.ts                 # all articles
 *   npx tsx scripts/migrate-content-markup.ts --slug=abc      # single
 *   npx tsx scripts/migrate-content-markup.ts --dry-run       # preview
 *
 * After this migration, rasterize.ts no longer needs to post-process
 * markdown — `<code>` and `<em>` in the HTML naturally produce backticks
 * and `_…_` via Turndown.
 */

import fs from 'fs';
import path from 'path';
import { getRasterizedManifestPath } from '../src/lib/raster-data';

const ARTICLES_DIR = path.join(process.cwd(), 'data', 'articles');

/** Quote-pair regex: any combination of curly “, ”, or straight ". */
const QUOTE_PAIR = /[“”"]([^“”"\n]+?)[“”"]/g;

/** Walk HTML, applying `fn` only to text outside `<tag …>` brackets. */
function transformTextNodes(html: string, fn: (text: string) => string): string {
  let out = '';
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      out += fn(html.slice(i));
      break;
    }
    if (lt > i) out += fn(html.slice(i, lt));
    const gt = html.indexOf('>', lt);
    if (gt === -1) {
      out += html.slice(lt);
      break;
    }
    out += html.slice(lt, gt + 1);
    i = gt + 1;
  }
  return out;
}

function convertQuotesInHtml(html: string): string {
  return transformTextNodes(html, (text) => text.replace(QUOTE_PAIR, '<code>$1</code>'));
}

function wrapBlockquotesWithEm(html: string): string {
  return html.replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/g, (_full, attrs, inner) => {
    const innerStr: string = inner;
    const hasP = /<p[\s>]/i.test(innerStr);
    let next: string;
    if (hasP) {
      next = innerStr.replace(/<p([^>]*)>([\s\S]*?)<\/p>/g, (_m, pAttrs, pInner) => {
        const trimmed = (pInner as string).trim();
        if (!trimmed) return `<p${pAttrs}>${pInner}</p>`;
        // Already wrapped entirely in <em>?
        if (/^<em[^>]*>[\s\S]*<\/em>$/i.test(trimmed)) return `<p${pAttrs}>${pInner}</p>`;
        return `<p${pAttrs}><em>${pInner}</em></p>`;
      });
    } else {
      const trimmed = innerStr.trim();
      if (!trimmed) next = innerStr;
      else if (/^<em[^>]*>[\s\S]*<\/em>$/i.test(trimmed)) next = innerStr;
      else next = `<em>${innerStr}</em>`;
    }
    return `<blockquote${attrs}>${next}</blockquote>`;
  });
}

function migrateHtml(html: string): string {
  if (!html) return html;
  return wrapBlockquotesWithEm(convertQuotesInHtml(html));
}

function migrateMarkdown(md: string): string {
  if (!md) return md;
  let out = md.replace(QUOTE_PAIR, '`$1`');
  // Italicize blockquote line contents (lines beginning with `>` followed by text).
  out = out.replace(/^(>\s*)(\S.*)$/gm, (m, prefix, text) => {
    const trimmed = (text as string).trim();
    if (/^_.+_$/.test(trimmed)) return m; // already italic
    return `${prefix}_${text}_`;
  });
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error('data/articles/ not found.');
    process.exit(1);
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (slugArg && data.slug !== slugArg) continue;

    const beforeContent: string = data.content ?? '';
    const newContent = migrateHtml(beforeContent);
    let contentChanged = newContent !== beforeContent;

    const manifestPath = getRasterizedManifestPath(data.slug);
    const manifest = fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      : null;

    let mdChangedCount = 0;
    if (manifest && Array.isArray(manifest.markdownPages)) {
      for (const p of manifest.markdownPages) {
        const before: string = p.markdown ?? '';
        const after = migrateMarkdown(before);
        if (after !== before) {
          p.markdown = after;
          mdChangedCount++;
        }
      }
    }

    const changed = contentChanged || mdChangedCount > 0;
    if (!changed) {
      skipped++;
      continue;
    }

    data.content = newContent;
    if (!dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      if (manifest && mdChangedCount > 0) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
      }
    }
    updated++;
    console.log(`  ${dryRun ? '(dry)' : '✓'} ${data.slug} — html:${contentChanged ? 'changed' : 'same'}, md:${mdChangedCount} pages`);
  }

  console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${updated} article(s). Skipped ${skipped}.`);
}

main();
