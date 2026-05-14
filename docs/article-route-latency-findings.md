# Route Latency Findings

## Scope

### Round 1 (previous analysis)

```text
GET /articles/sunglangtruyentinluc 200 in 3.3s (next.js: 824ms, application-code: 2.5s)
GET / 200 in 2.6s (next.js: 11ms, application-code: 2.6s)
GET /articles 200 in 2.3s (next.js: 80ms, application-code: 2.2s)
GET /articles/minhthonggiam-chinhbien050 200 in 1749ms (next.js: 57ms, application-code: 1691ms)
```

**Root cause (fixed):** repeated serial `getSiteConfig()` calls across layout + page, no `Promise.all` parallelization, no request-level deduplication.  
**Fix applied:** added `src/lib/public-data.ts` with `cache()`-wrapped helpers, switched public routes to `Promise.all`, added DB indexes.

### Round 2 (current)

```text
GET /articles/sunglangtruyentinluc 200 in 1675ms (next.js: 11ms, application-code: 1664ms)
GET /articles/phapbinhdinhcaomien 200 in 327ms (next.js: 12ms, application-code: 315ms)
```

These are both article detail page requests. The 5× gap between them is the subject of this investigation.

---

## Round 2 Analysis — `/articles/[slug]`

### Step-by-step measurements

Direct timings run against the live Neon database from this machine:

| Step | Time |
| --- | ---: |
| `getArticleBySlug()` — **cold** (first call, Neon WebSocket not yet open) | **1636 ms** |
| `getArticleBySlug()` — warm (connection already established) | ~265 ms |
| `getCachedSiteConfig()` — cold | 263 ms |
| `getCachedSiteConfig()` — warm (process-level cache hit) | 0.1 ms |
| `getArticlesLastUpdated()` aggregate query | 279 ms |

### What happens per request

The article detail page render pipeline, after the round-1 fixes:

```
generateMetadata()  →  getPublicArticleBySlug(slug)        [DB query, ~265 ms warm]
layout metadata     →  getPublicSiteConfig()               [cache hit after first request]
layout render       →  getPublicSiteConfig()               [cache hit, deduplicated]
page render         →  getPublicArticleBySlug(slug)        [deduplicated by React cache()]
                    →  auth()                              [JWT verify, no DB if role in token]
```

With the deduplication already in place via `React.cache()`, each warm request makes **exactly one DB round trip** — the `getArticleBySlug` query — at about **265 ms**.

### Why the two logged requests differ by 5×

| Request | Time | Explanation |
| --- | ---: | --- |
| `sunglangtruyentinluc` — 1664 ms | 1664 ms | **Cold** — this was the first DB query after a server restart. Neon's WebSocket connection had to be established from scratch: ~1370 ms of that is TCP + TLS + WebSocket handshake overhead. The actual query ran in ~265 ms. |
| `phapbinhdinhcaomien` — 315 ms | 315 ms | **Warm** — connection already open. Entire application-code time is one article `findUnique` plus ~50 ms of Next.js/auth overhead. |

This is confirmed by the measurement: cold `getArticleBySlug` = **1636 ms**, warm = **265 ms**. The delta (~1370 ms) is entirely Neon connection setup, not query work.

### Root cause

There are two distinct problems:

**Problem 1 — Neon connection cold start (~1370 ms, first request after restart)**

`src/lib/prisma.ts` uses `@prisma/adapter-neon` with WebSocket transport. The Neon serverless WebSocket adapter requires a full TCP + TLS + WebSocket upgrade before any query can run. This cost is paid once per process start, but in development every server restart triggers it again.

**Problem 2 — Uncached per-request article DB query (~265 ms, every request)**

`getArticleBySlug()` has no process-level memory cache. Every page view makes one `findUnique` round trip to Neon regardless of how recently the same article was fetched. For a publication site where articles change rarely, this is unnecessary.

The `getCachedArticleSummaries()` pattern already shows the correct shape: check `MAX(updatedAt)`, serve from memory if fresh. `getArticleBySlug` needs the same treatment.

### Recommended fix

#### Fix A — Cache per-slug article lookups (addresses Problem 2, reduces steady-state latency)

Add a per-slug map to `src/lib/cache.ts` using the same `updatedAt`-based invalidation already in use for summaries:

```ts
// src/lib/cache.ts
const articleBySlugCache = new Map<string, CacheEntry<Article | null>>();

export async function getCachedArticleBySlug(slug: string): Promise<Article | null> {
  const lastUpdated = await getArticlesLastUpdated();
  const cached = articleBySlugCache.get(slug);
  if (isFresh(cached ?? null, lastUpdated)) return cached!.data;

  const row = await prisma.article.findUnique({
    where: { slug },
    select: ARTICLE_SELECT,
  });
  const data = row ? dbToArticle(row) : null;
  articleBySlugCache.set(slug, { data, lastUpdated });
  return data;
}
```

Call `articleBySlugCache.delete(slug)` (or clear the whole map) inside `invalidateArticleCache()`. Then update `getPublicArticleBySlug` in `src/lib/public-data.ts` to call this instead of `getArticleBySlug`.

**Expected outcome:** warm article page drops from ~265 ms to ~0 ms (DB) + ~279 ms (invalidation check). The invalidation check is the new bottleneck — see Fix B.

#### Fix B — Batch-invalidation check (reduces invalidation check overhead)

The `getArticlesLastUpdated()` aggregate query runs once per `getCachedArticleBySlug` call (~279 ms per warm request). To avoid this:

- Cache the `lastUpdated` result itself with a short TTL (e.g. 5 seconds):

```ts
let lastUpdatedCache: { value: Date; expiresAt: number } | null = null;

async function getArticlesLastUpdated(): Promise<Date> {
  const now = Date.now();
  if (lastUpdatedCache && now < lastUpdatedCache.expiresAt) return lastUpdatedCache.value;
  const result = await prisma.article.aggregate({ _max: { updatedAt: true } });
  const value = result._max.updatedAt ?? new Date(0);
  lastUpdatedCache = { value, expiresAt: now + 5_000 };
  return value;
}
```

This means the invalidation check only hits the DB once every 5 seconds at most, not on every request. Articles will appear at most 5 seconds stale after a save (acceptable for a publication site).

#### Fix C — Warm the Neon connection at server start (addresses Problem 1, eliminates first-request penalty)

Use Next.js instrumentation to eagerly open the DB connection before the first user request arrives:

```ts
// src/instrumentation.ts  (already exists in the project)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmCaches } = await import('./lib/cache');
    await warmCaches().catch(() => {}); // establishes Neon connection + primes caches
  }
}
```

`warmCaches()` already exists and calls all the cache functions. Running it at startup makes the Neon WebSocket connection the moment the server is ready, so the first user request is not the one that pays the ~1370 ms setup cost.

### Expected latency after all three fixes

| Scenario | Before | After |
| --- | ---: | ---: |
| Cold (first request after restart) | ~1664 ms | ~280 ms (invalidation check, no article DB hit) |
| Warm hit (same article, cache fresh) | ~315 ms | ~0–5 ms (pure memory) |
| Warm miss (invalidation check + article fetch) | ~315 ms | ~280 ms (one aggregate, no findUnique) |

### Fix priority

1. **Fix C first** — cheapest to implement, eliminates the worst-case 1664 ms cold hit entirely. `src/instrumentation.ts` already exists; just add the `warmCaches()` call.
2. **Fix A** — adds per-slug article cache. Most impactful for steady-state.
3. **Fix B** — add TTL to the invalidation check. Reduces the one remaining DB query per warm request from every hit to once per 5 seconds.