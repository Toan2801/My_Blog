# History Blog

This repository contains a Next.js 16 application for publishing long-form history articles, series pages, videos, and admin-managed site settings.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A reachable MongoDB instance

## Development Setup

1. Install dependencies:

	```bash
	npm install
	```

2. Create a local environment file from the example:

	```bash
	copy .env.example .env.local
	```

3. Update `.env.local` with your MongoDB connection string.

4. Start the development server:

	```bash
	npm run dev
	```

5. Open `http://localhost:3000` in your browser.

## Environment Variables

| Name | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Connects the app and migration script to MongoDB. |
| `NEXT_PUBLIC_SITE_URL` | No | Base URL used by redirect routes. Defaults to the deployed production URL when omitted. |

## Data and Storage

- Source content for migrations lives in `data/articles/*.json` and `data/config.json`.
- Uploaded files are written to `public/uploads/` by the upload API routes.
- The app expects `public/uploads/` to remain writable during local development.
- Rasterized page images are written to `data/page-images/{slug}/page-N.png`. This directory sits **outside** `public/` on purpose — images are served through a token-gated API route (`/api/articles/[slug]/page/[n]/image`) so they cannot be hot-linked or scraped. The directory is gitignored; treat it as a build artifact, not source.
- Each article document also carries a `markdownPages` array (one markdown blob per rasterized page). This powers in-reader search and must stay in sync with the `pages` array.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run migrate                          # full migration: JSON → DB + rasterize + markdownPages
npm run rasterize                        # re-rasterize all published articles (writes pages + markdownPages to JSON)
npm run rasterize -- --slug=<slug>       # rasterize a single article
npx tsx scripts/sync-pages-to-db.ts      # push pages + markdownPages from JSON to MongoDB (no re-rasterize)
```

See [docs/migration-markdown-pages.md](docs/migration-markdown-pages.md) for the team's step-by-step guide to migrating an article to the new markdown-paged format.

## Project Structure

- `src/app/`: Next.js App Router pages, layouts, and API routes
- `src/components/`: Reusable UI and editor components
- `src/lib/`: Data access, utilities, and MongoDB connection logic
- `src/models/`: Mongoose models
- `data/`: Seed content and configuration JSON files

## Notes

- This project uses the App Router on Next.js 16 and React 19.
- If MongoDB is not configured, server code that imports `src/lib/mongoose.ts` will fail fast by design.
- Rasterization uses Puppeteer (a devDependency). `npm run migrate` and `npm run rasterize` require it; the Next.js runtime does not.
- The reader fetches images with a short-lived session token (see [src/lib/reader-token.ts](src/lib/reader-token.ts)). Direct GETs of `/api/articles/.../image` without `?t=<token>` will be rejected.
