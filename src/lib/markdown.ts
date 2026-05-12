/**
 * markdown.ts — Render article markdown to HTML.
 *
 * Article `content` is stored as markdown (since the html-to-markdown migration).
 * This module is the single source of truth for the markdown rendering rules,
 * shared by:
 *   - The rasterizer (src/lib/rasterize.ts) — converts MD → HTML before paginating.
 *   - The article view page (src/components/ArticleBody.tsx) — renders the article body.
 *
 * Conventions:
 *   - Image captions follow the image as an italic line (`![alt](src)\n*caption*`),
 *     and we re-pair them into a `<div class="resizable-image-parent">…</div>`
 *     wrapper so existing CSS + the rasterizer's image-page detection keep working.
 *   - Soft `<br>` line breaks come from CommonMark trailing two-space markers.
 */

import MarkdownIt from 'markdown-it';

const renderer = new MarkdownIt({
  html: true,        // pass through inline HTML (e.g., <code>, <em>)
  breaks: false,     // soft breaks via `  \n` only (CommonMark)
  linkify: false,
  typographer: false,
});

/** Detect un-migrated legacy data (still HTML) so we don't re-render it as markdown. */
export function isLikelyHtml(s: string): boolean {
  return /<[a-z][a-z0-9]*\b[^>]*>/i.test(s);
}

/** Convert article markdown into the HTML the rasterizer / reader expects. */
export function renderArticleMarkdown(md: string): string {
  if (!md) return '';
  if (isLikelyHtml(md)) return md; // legacy fallback

  let html = renderer.render(md);

  // Pair `<p><img …></p>` immediately followed by `<p><em>caption</em></p>`
  // into the figure-style wrapper used elsewhere in the codebase.
  html = html.replace(
    /<p>\s*<img([^>]*)>\s*<\/p>\s*<p>\s*<em>([\s\S]*?)<\/em>\s*<\/p>/g,
    (_m, imgAttrs: string, caption: string) =>
      `<div class="resizable-image-parent"><div class="resizable-image-content"><img${imgAttrs}><div class="image-caption">${caption}</div></div></div>`,
  );
  // Captionless image still gets wrapped so downstream logic can detect it as an image block.
  html = html.replace(
    /<p>\s*<img([^>]*)>\s*<\/p>/g,
    (_m, imgAttrs: string) =>
      `<div class="resizable-image-parent"><div class="resizable-image-content"><img${imgAttrs}></div></div>`,
  );

  return html;
}
