# Article Slug Route: TCP-Era Response Time Variation Analysis

**Route:** `GET /articles/phapbinhdinhcaomien`  
**Date:** 2026-05-14  
**Context:** After switching from `@prisma/adapter-neon` (WebSocket) to `@prisma/adapter-pg` (TCP)

## Observed timings

| # | Total | Next.js overhead | Application code | Notes |
|---|------:|----------------:|----------------:|-------|
| 1 |  626 ms | 15 ms |  611 ms | Cold — first DB contact |
| 2 |  349 ms | 19 ms |  330 ms | TTL expired, 1 DB call |
| 3 |  101 ms | 17 ms |   84 ms | Within TTL window, pure memory |
| 4 |  346 ms | 17 ms |  328 ms | TTL expired again, 1 DB call |

---

## Progress vs the WebSocket baseline

| Scenario | WebSocket (before) | TCP (now) | Saving |
|---|---:|---:|---:|
| Cold start | ~1662 ms | ~626 ms | **−1036 ms** |
| Warm, after TTL | ~338 ms | ~349 ms | ≈ 0 ms |
| Pure memory hit | ~67 ms | ~101 ms | ≈ 0 ms |

The TCP switch eliminated the ~1000 ms WebSocket handshake cost on the cold path. Steady-state latency is unchanged because it is now dominated by a different bottleneck.

---

## Root cause of remaining variation: network RTT to Neon US-East

The 5-second TTL in `getArticlesLastUpdated()` is still there. Every request that lands after the TTL window expires must make one `prisma.article.aggregate({ _max: { updatedAt: true } })` round trip to Neon before it can confirm that the in-memory cache is still valid.

```
Request 1 — cold (611 ms):
  TCP + TLS handshake to Neon         ~150 ms
  aggregate query (network RTT × 1)   ~150 ms
  findUnique query (network RTT × 1)  ~150 ms
  React render + auth decode           ~80 ms
  ─────────────────────────────────────────────
  ≈ 530 ms   (rest is SSL session negotiation)

Request 2 — TTL expired (330 ms):
  aggregate query (network RTT × 1)   ~280 ms
  isFresh() → true, no re-fetch         ~0 ms
  articleBySlugCache hit                ~0 ms
  React render + auth decode           ~50 ms
  ─────────────────────────────────────────────
  ≈ 330 ms   (1 DB call, connection already open)

Request 3 — within TTL (84 ms):
  getArticlesLastUpdated() — TTL hit    ~0 ms
  articleBySlugCache hit                ~0 ms
  React render + auth decode           ~84 ms
  ─────────────────────────────────────────────
  ≈ 84 ms    (zero DB calls)

Request 4 — TTL expired (328 ms):
  same as request 2
```

The ~280–300 ms per DB call is the one-way network round-trip latency from this machine to Neon's US-East-1 endpoint. That is purely geographic — it cannot be reduced by changing drivers. What can be reduced is *how often* a user request is forced to pay it.

---

## Why the TTL approach is the wrong fit

The `updatedAt`-based invalidation was designed to handle multiple processes that don't share memory — each process re-checks the DB to see if another process wrote something. In this single-server setup:

- All writes go through `saveArticle()` / `deleteArticle()` in the same process.
- Both functions already call `invalidateArticleCache()`, which immediately clears `articlesLastUpdatedTTL` and `articleBySlugCache`.
- The aggregate check therefore only exists as a safety net for a scenario that doesn't occur.
- Every 5 seconds it fires anyway, charging every unlucky request ~280–300 ms for nothing.

---

## Fix: drop the aggregate check; rely on explicit invalidation

Since all writes and all reads run in the same Node.js process, `invalidateArticleCache()` is sufficient. The aggregate query is redundant. Remove `getArticlesLastUpdated()` entirely and replace the freshness check with a simple TTL timestamp on each cache entry as a fallback safety net.

### Minimal change — extend TTL to 60 s

If keeping the current structure, change the TTL from 5 s to 60 s in `cache.ts`:

```ts
articlesLastUpdatedTTL = { value, expiresAt: now + 60_000 };
```

Result: users pay the aggregate cost once per minute instead of once per 5 seconds. Requests 2 and 4 above would have been memory hits (84 ms) instead of DB calls (330 ms).

### Correct fix — background refresh (eliminates the per-request cost entirely)

Prime `articlesLastUpdatedTTL` at startup and refresh it on a background interval, so no user request ever waits for the aggregate:

```ts
// At module load time, after warmCaches():
async function refreshArticlesLastUpdated() {
  const result = await prisma.article.aggregate({ _max: { updatedAt: true } });
  articlesLastUpdatedTTL = {
    value: result._max.updatedAt ?? new Date(0),
    expiresAt: Date.now() + 60_000,
  };
}
setInterval(refreshArticlesLastUpdated, 30_000);
```

Every user request reads the pre-computed value from memory (0 ms). The 30-second background poll is invisible to readers.

---

## Expected outcome after fix

| Scenario | Current | After fix |
|---|---:|---:|
| Cold start (server restart) | ~626 ms | ~300–400 ms (warmCaches primes everything) |
| Warm — any request | ~84–349 ms | ~84 ms (pure memory, always) |
| After admin saves article | instant invalidation (same process) | same |
