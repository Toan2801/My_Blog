# Migration Guide: `markdownPages` + Token-Gated Images

> Current note: `pages` and `markdownPages` are no longer stored on the database `Article` row. They now live in `storage/page-images/<slug>/manifest.json` beside the rasterized PNGs. Any older references in this guide to syncing generated page data back into MongoDB/PostgreSQL are historical and should be read as `re-run npm run rasterize` instead.

This guide walks the team through migrating articles to the new data shape introduced in commit `f6166fc` ("feat: implement search functionality in CanvasReader with token-gated image access").

It applies whenever you:
- pull this commit for the first time on an existing checkout,
- add a new article and need to publish it to production,
- edit an existing article's `content` field and need the reader/search to reflect the new text, **or**
- restore a database that was dumped before this commit.

---

## What changed

1. **New per-page markdown.** Each rasterized article now stores `pages` and `markdownPages` in `storage/page-images/<slug>/manifest.json`. The reader's search feature reads this manifest to find matches.
2. **Page image URLs moved.** `pages[].imageUrl` is now `/api/articles/<slug>/page/<n>/image` (token-gated API) instead of `/data/image/articles/<slug>/page-N.png` (static file).
3. **Image output directory moved.** PNGs are written to `storage/page-images/<slug>/` (outside `public/`, gitignored) instead of `public/data/image/articles/<slug>/`.
4. **Raster data is static.** Re-rasterizing regenerates both the PNGs and `manifest.json`; there is no separate DB sync step for generated page data anymore.

The JSON shape now looks like:

```jsonc
{
  "slug": "example",
  "title": "...",
  "content": "<p>...</p>",
  "pages": [
    { "pageNumber": 1, "imageUrl": "/api/articles/example/page/1/image" }
  ],
  "markdownPages": [
    { "pageNumber": 1, "markdown": "First page text..." }
  ]
}
```

`pages.length` must equal `markdownPages.length`. Page numbers must align 1:1.

---

## Prerequisites

- Node 20+ and npm 10+.
- `.env.local` with a valid `MONGODB_URI`.
- A working Puppeteer install (`npm install` pulls it as a devDependency). On Linux CI you may need `--no-sandbox` flags, which the script already passes.
- The article's source JSON in `data/articles/<slug>.json` with a non-empty `content` field and `status: "published"`.

> Drafts (`status: "draft"`) are intentionally skipped by both `migrate` and `rasterize`.

---

## Choose your path

| Situation | Run this |
|---|---|
| Fresh checkout / cold DB | `npm run migrate` |
| Edited `content` of one article | `npm run rasterize -- --slug=<slug>` then `npx tsx scripts/sync-pages-to-db.ts` |
| Edited multiple articles | `npm run rasterize` then `npx tsx scripts/sync-pages-to-db.ts` |
| Teammate already rasterized and committed the JSON; you just need DB updated | `npx tsx scripts/sync-pages-to-db.ts` |
| DB is fine, just need local images regenerated for dev | `npm run rasterize` |

---

## Path A — Full migration (fresh DB)

```bash
npm install
npm run migrate
```

`migrate.ts` will:

1. Upsert `data/config.json` into the `SiteConfig` collection.
2. Upsert every `data/articles/*.json` into the `Article` collection.
3. For each published article: rasterize PNGs to `data/page-images/<slug>/`, convert each page to markdown, **write the updated `pages` and `markdownPages` back into the JSON file**, and update the matching MongoDB document.

Expected output ends with:

```
CHÚC MỪNG MIGRATION THÀNH CÔNG!
```

Verify in MongoDB that one article has both `pages` and `markdownPages` populated and that their lengths match.

---

## Path B — Updating a single article after a content edit

When you change `content` in a JSON file, the existing `pages` and `markdownPages` are stale and the search index will return wrong line numbers.

```bash
# 1. Re-rasterize the one article. This rewrites pages + markdownPages in the JSON file
#    and writes fresh PNGs to data/page-images/<slug>/.
npm run rasterize -- --slug=my-article

# 2. Review the JSON diff. The pages[].imageUrl values should all be
#    /api/articles/<slug>/page/<n>/image; markdownPages should look like the
#    text the reader will display.
git diff data/articles/my-article.json

# 3. Push the new pages + markdownPages into MongoDB without re-rasterizing.
npx tsx scripts/sync-pages-to-db.ts
```

Commit the JSON changes. Do **not** commit `data/page-images/` (gitignored — regenerated on each developer machine).

---

## Path C — Sync-only (teammate's JSON already updated)

If a teammate has run rasterize, committed the updated JSON, and you just pulled:

```bash
npx tsx scripts/sync-pages-to-db.ts
```

This is fast (no Puppeteer, no image rendering). It only touches articles whose JSON already has both `pages` and `markdownPages`; articles missing either field are skipped and reported.

You still need the PNG files locally to view the reader in dev. Run `npm run rasterize` if you want them.

---

## Verifying a successful migration

1. **JSON shape.** Open one article's JSON. Confirm:
   - `pages[].imageUrl` starts with `/api/articles/`
   - `markdownPages` is present and has the same length as `pages`
2. **Filesystem.** `data/page-images/<slug>/` contains `page-1.png`, `page-2.png`, … one per page.
3. **Database.** In MongoDB, the same article document has both arrays populated.
4. **Reader.** `npm run dev`, open `/read/<slug>`, paginate to the last page, then open the search panel and search for a word you can see on screen — the result should jump to the right page.

---

## Troubleshooting

- **`Missing MONGODB_URI`** — Create `.env.local` from `.env.example` and set `MONGODB_URI`.
- **Puppeteer fails to launch on Linux/CI** — The scripts already pass `--no-sandbox --disable-setuid-sandbox --disable-gpu`. If you still see crashes, install Chromium's system dependencies (`apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2`).
- **Old image paths still in DB after migration** — Some article was loaded from the JSON before its `pages` array was updated. Re-run `npx tsx scripts/sync-pages-to-db.ts`.
- **`pages.length !== markdownPages.length`** — Don't hand-edit one without the other. Always go through `npm run rasterize`, which regenerates both atomically.
- **Reader shows broken images, network tab shows 401/403 on `/page/N/image`** — The session token is missing/expired. Reload the reader page; the token is minted on entry. If the problem persists, check [src/lib/reader-token.ts](../src/lib/reader-token.ts) and the corresponding API route.
- **Reader shows the old PNG path (`/data/image/articles/...`)** — A JSON file wasn't re-rasterized after pulling this commit. Run Path B for that slug.

---

## Rollback

If you need to revert to the pre-commit state:

1. `git revert f6166fc` (or check out the previous commit).
2. Restore the previous `Article` documents from a Mongo backup, OR re-run the older `npm run migrate` from that revision.
3. Old PNGs lived in `public/data/image/articles/`. That path is still in `.gitignore`, but the files won't regenerate themselves — you'll need to run the older rasterize script too.

In practice, prefer rolling forward (fix the data) over rolling back.
