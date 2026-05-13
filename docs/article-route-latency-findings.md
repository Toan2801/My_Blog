# Article Route Latency Findings

## Scope

Investigated the slow article detail route reported in `prompt.md`:

```text
GET /articles/sunglangtruyentinluc 200 in 23.6s (next.js: 20.8s, generate-params: 20.6s, application-code: 2.9s)
GET /articles/minhthonggiam-chinhbien013 200 in 4.1s (next.js: 42ms, application-code: 4.0s)
```

This is a page-route investigation, not an API-route investigation. The slow path is the App Router page at `src/app/articles/[slug]/page.tsx`.

## Findings

### 1. The 23.6s request was dominated by `generateStaticParams`

The first log already points at the main cause: `generate-params: 20.6s`.

That slow path came from the previous article route implementation, where `generateStaticParams()` loaded all published articles just to extract slugs. Because `getAllArticles()` in `src/lib/data.ts` fetched full article rows, this forced the route to pull every article's large text and JSON fields before rendering a single page.

Impact:

- Every article page request paid for a global article scan.
- The cost scaled with total article count and article size.
- Large `content` and `markdownPages` fields made the problem much worse.

Status:

- This specific `generateStaticParams` bottleneck has already been removed from the current route implementation.

### 2. The remaining 4.0s application time comes from over-fetching a very large article row

Current `src/app/articles/[slug]/page.tsx` calls `getArticleBySlug(slug)` twice per request:

- once in `generateMetadata()`
- once again in the page component

Current `getArticleBySlug()` in `src/lib/data.ts` does a plain `prisma.article.findUnique({ where: { slug } })`, which loads the full article row even though the article detail page only uses:

- `title`
- `excerpt`
- `author`
- `coverImage`
- `status`

The query still transfers these heavy fields on every request:

- `content`
- `footnotes`
- `pages`
- `markdownPages`

The schema in `prisma/schema.prisma` confirms those fields live on the same `Article` row.

## Runtime Evidence

Direct Prisma measurements against the current database:

| slug | full row fetch | slim summary fetch | serialized row size |
| --- | ---: | ---: | ---: |
| `sunglangtruyentinluc` | 2480.2 ms | 262.0 ms | 172,726 bytes |
| `minhthonggiam-chinhbien013` | 1579.4 ms | 258.5 ms | 3,627,830 bytes |

Field sizes for `minhthonggiam-chinhbien013`:

- `content`: 1,812,382 chars
- `markdownPages`: 1,804,789 chars
- `pages`: 9,741 chars
- `footnotes`: 2 chars

This means the slow article is carrying about 3.6 MB of serialized data, and most of it is text that the article detail page does not use.

## Why the 4.0s Log Makes Sense

The `/articles/[slug]` page currently does two independent article reads:

1. `generateMetadata()` fetches the article.
2. The page component fetches the same article again.

There is no function-level memoization around `getArticleBySlug()`.

Because Prisma calls are not automatically deduplicated the way identical `fetch()` calls can be, both reads hit the database separately. For the large article above, one full-row fetch was about 1.6s in direct measurement, so duplicate reads alone are enough to explain most of the reported 4.0s application time.

## Secondary Factors

### Remote database transport amplifies the cost

`src/lib/prisma.ts` uses the Neon serverless adapter over WebSockets. That adds network and transport overhead to every Prisma query. The bigger the row, the more expensive this becomes.

### `auth()` keeps the route dynamic

The page also calls `auth()`, so the route is rendered per request. That is not the primary bottleneck here, but it prevents the article detail page from being a simple static render.

## Most Likely Root Cause

The current slow path is not React rendering. It is database over-fetching:

- fetching the entire `Article` record for a page that only needs summary fields
- doing that full fetch twice per request
- sending multi-megabyte article payloads over a remote Neon connection

## Recommended Fix Direction

1. Split article reads by use case.
   - Add a lightweight `getArticleSummaryBySlug()` for `/articles/[slug]` metadata and page chrome.
   - Keep full article reads only for routes that actually need `content`, `pages`, or `markdownPages`.

2. Stop reading the same article twice per request.
   - Reuse one cached server function for both metadata and page rendering, or share a slim memoized lookup.

3. Treat `content` and `markdownPages` as heavy fields.
   - Do not include them in default article queries.

4. Review other routes using `getArticleBySlug()`.
   - The same full-row fetch pattern also exists in `/read/[slug]` and several article-related API routes.