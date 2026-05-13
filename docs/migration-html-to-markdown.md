# Migration Guide: HTML → Markdown Source Content

This guide walks the team through migrating article source content from HTML to Markdown.

## Why

The `content` field on each article used to hold HTML; the rasterizer would convert it to per-page markdown for search. That meant:

- Source of truth was HTML, but Markdown was a derivative.
- Visual changes required touching every article's HTML.
- The HTML carried inline styles that fought our render CSS.

Going forward, the source of truth is **Markdown**. The rasterizer and the article view both convert Markdown → HTML at render time through [src/lib/markdown.ts](../src/lib/markdown.ts), so the visual layer is now centralized.

## What the migration does

[scripts/migrate-html-to-markdown.ts](../scripts/migrate-html-to-markdown.ts) transforms each article's `content` from HTML to Markdown using Turndown. The encoding conventions chosen for this codebase are:

| Concern | Encoding |
|---|---|
| Image | `![alt](src)` |
| Image caption | Sibling italic line: `*caption*` (or `_caption_` depending on Turndown's emDelimiter) |
| Image width (50%/100%) | **Dropped** — all images render at a single default width |
| Soft line break (`<br>`) | CommonMark trailing two-space soft break (`  \n`) |
| Inline `<code>` / `<em>` | Already in the data after the content-markup migration → become `` `…` `` / `_…_` natively |
| `<span style="display:none">` | Dropped |
| `<div>` wrappers | Stripped; their text children survive |

The rasterizer's reverse path ([src/lib/markdown.ts](../src/lib/markdown.ts)) re-pairs `![alt](src)` followed by an italic caption line back into the `<div class="resizable-image-parent">…</div>` structure the paginator and CSS expect.

Things that **are not** preserved:
- Custom inline `style` declarations on tags.
- `data-width`, `data-caption` attributes (caption survives as text; width does not).
- Visual hints inside captions other than text.

If an article relies on visual treatment that can't be expressed in Markdown, capture that decision in CSS (a shared rule keyed off a class) rather than in inline styles.

## Order of operations (one-time rollout)

> **Already migrated**: `content-markup` migration (quotes → `<code>`, blockquote text → `<em>`). It's idempotent, so re-running is safe.

Run from the repository root.

```bash
# 1. (Re-run for safety — idempotent.) Add <code> and <em> to HTML and any
#    existing raster manifest markdownPages.
npx tsx scripts/migrate-content-markup.ts

# 2. Convert each article's `content` field from HTML to Markdown.
npx tsx scripts/migrate-html-to-markdown.ts

# 3. Re-rasterize all articles. The rasterizer now reads markdown, converts to HTML,
#    paginates, and writes the per-page PNGs + manifest.json.
npm run rasterize
```

### Targeted run (single article)

```bash
npx tsx scripts/migrate-content-markup.ts --slug=<slug>
npx tsx scripts/migrate-html-to-markdown.ts --slug=<slug>
npm run rasterize -- --slug=<slug>
```

### Dry runs

```bash
npx tsx scripts/migrate-content-markup.ts --dry-run
npx tsx scripts/migrate-html-to-markdown.ts --dry-run
```

Both print a per-article summary without writing anything to disk.

## Idempotency

- `migrate-content-markup.ts` skips text already wrapped in `<code>` and blockquotes already containing `<em>`.
- `migrate-html-to-markdown.ts` detects markdown-shaped input (no HTML tags) and leaves it alone.

It is therefore safe to re-run either script multiple times — useful when you import a new article from outside.

## Authoring new articles

Once migrated, **store new articles as Markdown** in `data/articles/<slug>.json`'s `content` field. Use the conventions above for images.

The admin RichTextEditor still produces HTML; if you save through the admin UI, the new HTML lands in `content` and `isLikelyHtml(content)` triggers the legacy fallback (HTML pass-through). To bring such an article fully into the new shape, run the two migrations again — they're idempotent.

> **Follow-up work**: the admin RichTextEditor needs to be updated to load/save Markdown end-to-end so new admin saves don't reintroduce HTML. Tracked separately.

## Verification checklist

After the rollout:

1. **`content` is Markdown.** `head -c 400 data/articles/<slug>.json | jq -r .content` should show markdown headings and text, not HTML tags.
2. **Images intact.** Skim a few article view pages and a few rasterized PNGs — caption text and image both present.
3. **Search still works.** Use the reader's search panel; backticked code and italic blockquotes render correctly in snippets.
4. **No raw `_` or `` ` `` showing through in PNGs.** Those would indicate the markdown→HTML conversion didn't fire.

## Rollback

The migrations write back into the same JSON files. To roll back:
- `git restore data/articles/` (if changes are not yet committed).
- Or restore from your `data/articles/` backup taken before the migrations.

The article schema still keeps `content` as the source field, so rollback is just restoring the JSON source content and rerunning the import/rasterization flow.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Markdown shows literal `\_` or `\.` inside text | Turndown's standard escaping. Renders correctly. | Ignore — pure cosmetics. |
| Image renders without caption | Caption line not directly under `![…](…)` (extra blank line, or wrong italic syntax). | Edit the markdown so caption is on the next line, wrapped in `*…*` or `_…_`. |
| Caption appears as a separate paragraph instead of figcaption | Same as above. | Same fix. |
| Search returns 0 hits for known phrase | `markdownPages` in the raster manifest were not regenerated after migration. | Re-run `npm run rasterize`. |
| Article view page shows raw markdown | Stale build; HMR not picking up the new `ArticleBody`. | Restart `npm run dev`. |
