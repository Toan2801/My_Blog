# Article Slug Route: Response Time Variation Analysis

**Route:** `GET /articles/sunglangtruyentinluc`  
**Date:** 2026-05-14

## Observed timings

| # | Total | Next.js overhead | Application code | Notes |
|---|------:|----------------:|----------------:|-------|
| 1 | 1662 ms | 16 ms | 1646 ms | First request after server start |
| 2 |   67 ms | 11 ms |    56 ms | Immediate follow-up |
| 3 |  338 ms | 13 ms |   324 ms | ~5 s after request 2 |
| 4 |  334 ms | 19 ms |   316 ms | Back-to-back with request 3 |

Next.js overhead is negligible and constant throughout (~11–19 ms). All variance is in application code.

---

## Root cause: two-tier cache with a 5-second TTL

Every call to `getCachedArticleBySlug(slug)` in `src/lib/cache.ts` must first call `getArticlesLastUpdated()` to decide whether the in-memory entry is still valid. That function has a **5-second TTL**:

```ts
// src/lib/cache.ts
async function getArticlesLastUpdated(): Promise<Date> {
  const now = Date.now();
  if (articlesLastUpdatedTTL && now < articlesLastUpdatedTTL.expiresAt) {
    return articlesLastUpdatedTTL.value;   // ← free
  }
  // TTL expired → hit Neon with an aggregate query (~270–300 ms round trip)
  const result = await prisma.article.aggregate({ _max: { updatedAt: true } });
  const value = result._max.updatedAt ?? new Date(0);
  articlesLastUpdatedTTL = { value, expiresAt: now + 5_000 };
  return value;
}
```

This creates three distinct states:

### State 1 — cold cache (request 1, 1646 ms)

Server just started. `articlesLastUpdatedTTL` is null, `articleBySlugCache` is empty.

```
getArticlesLastUpdated()         ~280 ms   (Neon aggregate, no TTL yet)
prisma.article.findUnique(slug)  ~265 ms   (Neon, article not cached)
auth() JWT decode                  ~5 ms
React render                      ~90 ms
──────────────────────────────────────────
≈ 640 ms pure work (rest is Neon connection/handshake overhead on first call)
```

The remaining ~1000 ms on request 1 is the **Neon WebSocket cold-start cost** — TCP handshake, TLS negotiation, and WebSocket upgrade on the very first connection from this process. `warmCaches()` in `instrumentation.ts` establishes the connection at startup, but if the server restarted just before this measurement the warm-up may not have completed in time, or the connection had been idle long enough for Neon to close it.

### State 2 — fully warm cache, within TTL window (request 2, 56 ms)

Immediately after request 1, both TTL caches are hot:

```
getArticlesLastUpdated()     0 ms   (articlesLastUpdatedTTL not yet expired)
getCachedArticleBySlug()     0 ms   (articleBySlugCache hit)
auth() JWT decode            ~5 ms
React render                ~50 ms
──────────────────────────────────────────
≈ 56 ms   (zero DB calls)
```

### State 3 — TTL expired, article data still fresh (requests 3 & 4, ~325–335 ms)

~5 seconds pass. `articlesLastUpdatedTTL` expires. `articleBySlugCache` is still populated with the correct data.

```
getArticlesLastUpdated()         ~280 ms   (Neon aggregate, TTL reset to +5s)
isFresh() → true                   0 ms   (MAX(updatedAt) unchanged)
articleBySlugCache.get(slug)       0 ms   (memory)
auth() JWT decode                  ~5 ms
React render                      ~40 ms
──────────────────────────────────────────
≈ 325 ms   (1 DB call, no article re-fetch)
```

This is the **steady-state cost**: one ~280 ms Neon aggregate query every 5 seconds, even though the article content never changed.

---

## Why each request falls into its state

```
t=0 s   → request 1: cold start, 2 DB calls         → 1662 ms
t=0.5 s → request 2: TTL hot, cache hot, 0 DB calls →   67 ms
t=6 s   → request 3: TTL expired, 1 DB call          →  338 ms
t=7 s   → request 4: TTL hot again, 0 DB calls       →  334 ms  ← same request window
```

Requests 3 and 4 appear to both be slow because they were issued back-to-back and both fell just after the 5-second mark, both expiring the TTL. If a second request arrives within the same ~280 ms window as the aggregate query (i.e. two concurrent requests), both will race to call the aggregate because the TTL was not yet refreshed by the first one finishing.

---

## Fix options

### Option A — Increase the TTL (low effort, immediate improvement)

Change 5 s → 30 s in `getArticlesLastUpdated()`. The invalidation aggregate only matters when an article was recently saved; in the common read-only case this cost is wasted work. 30 s reduces the DB call frequency by 6×.

```ts
articlesLastUpdatedTTL = { value, expiresAt: now + 30_000 };
```

**Tradeoff:** after an admin saves an article, readers could see a stale 404 or stale metadata for up to 30 s (the in-memory article cache doesn't know yet). `invalidateArticleCache()` already clears `articlesLastUpdatedTTL` on write, so the stale window only applies to processes that haven't received a write event (i.e. in a multi-process deploy).

### Option B — Background refresh (medium effort, eliminates steady-state latency entirely)

Replace the synchronous TTL check with a background `setInterval` that refreshes `articlesLastUpdatedTTL` proactively every N seconds. Every user request then gets the TTL result immediately from memory (0 ms).

```ts
setInterval(async () => {
  const result = await prisma.article.aggregate({ _max: { updatedAt: true } });
  articlesLastUpdatedTTL = {
    value: result._max.updatedAt ?? new Date(0),
    expiresAt: Date.now() + 30_000,
  };
}, 10_000);
```

Requests always read the pre-computed value. No user request ever pays the ~280 ms aggregate cost.

### Option C — Drop `updatedAt`-based invalidation for slug lookups (simplest)

Rely purely on `invalidateArticleCache()` called from `saveArticle()` / `deleteArticle()` and a generous fixed TTL (e.g. 60 s) as a safety net. Since all writes go through the same process in this single-server setup, explicit invalidation is sufficient and `getArticlesLastUpdated()` is not needed for correctness.

---

## Summary

| Scenario | Latency | DB calls | Cause |
|---|---:|---:|---|
| Cold start (first request) | ~1600 ms | 2 | Neon cold start + no cached data |
| Warm, within 5s TTL | ~60 ms | 0 | Pure memory |
| Warm, after 5s TTL | ~330 ms | 1 | Aggregate query to check `MAX(updatedAt)` |

The 5-second TTL was introduced to avoid hitting the DB on every request, but at 5 s the aggregate is still called frequently enough to dominate latency on any request that lands after a TTL boundary. Raising the TTL to 30 s or switching to a background refresh (Option B) would reduce steady-state latency to the ~60 ms memory-hit baseline.
