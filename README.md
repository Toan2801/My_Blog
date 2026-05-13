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
| `MONGODB_DB` | No | Explicit database name for the NextAuth adapter. |
| `AUTH_SECRET` | Yes (prod) | NextAuth signing secret. Generate with `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Enables Google SSO. Without them only Credentials sign-in works. |
| `READER_TOKEN_SECRET` | Recommended | HMAC secret for canvas-reader tokens. Falls back to `MONGODB_URI` for dev. |
| `ADMIN_EMAILS` | No | Comma-separated list of emails auto-promoted to admin on sign-in. Defaults to `admin@abc.com`. |
| `NEXT_PUBLIC_SITE_URL` | No | Base URL used by redirect routes. Defaults to the deployed production URL when omitted. |

## Data and Storage

- Source content for migrations lives in `data/articles/*.json` and `data/config.json`.
- Uploaded files are written to `public/uploads/` by the upload API routes.
- The app expects `public/uploads/` to remain writable during local development.
- Rasterized page images are written to `storage/page-images/{slug}/page-N.png`. This directory sits **outside** `public/` on purpose — images are served through a token-gated API route (`/api/articles/[slug]/page/[n]/image`) so they cannot be hot-linked or scraped. The directory is gitignored; treat it as a build artifact, not source.
- Each rasterized article directory also carries `storage/page-images/{slug}/manifest.json`, which stores the generated `pages` and `markdownPages` arrays used by the reader and in-reader search.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run migrate                          # full migration: JSON → DB
npm run migrate:users                    # seed admin@abc.com / Admin1234 (idempotent)
npm run rasterize                        # re-rasterize all published articles (writes PNGs + manifest.json to storage/page-images)
npm run rasterize -- --slug=<slug>       # rasterize a single article
npm test                                 # run vitest suites
```

See [docs/migration-markdown-pages.md](docs/migration-markdown-pages.md) for the team's step-by-step guide to migrating an article to the new markdown-paged format.

Article source content is stored as **Markdown** in each JSON's `content` field. See [docs/migration-html-to-markdown.md](docs/migration-html-to-markdown.md) for the HTML → Markdown migration that brought existing data to this shape and the conventions used for images, captions, and inline formatting.

Authentication, RBAC, the canvas reader's trial mode, and the admin book-master dashboard are documented in [docs/auth-and-admin.md](docs/auth-and-admin.md). After cloning, run `npm run migrate:users` to seed the mock admin account (`admin@abc.com` / `Admin1234`).

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
