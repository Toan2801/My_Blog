# History Blog

This repository contains a Next.js 16 application for publishing long-form history articles, series, videos, and reader-safe rasterized book pages.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A reachable PostgreSQL database

## Development Setup

1. Install dependencies:

	```bash
	npm install
	```

2. Create `.env.local` and set the required values:

	```env
	DATABASE_URL=postgresql://...
	AUTH_SECRET=replace-with-a-random-secret
	NEXT_PUBLIC_SITE_URL=http://localhost:3000
	```

3. Optional environment variables:

	```env
	READER_TOKEN_SECRET=replace-with-a-random-secret
	ADMIN_EMAILS=you@example.com
	GOOGLE_CLIENT_ID=
	GOOGLE_CLIENT_SECRET=
	```

4. Start the development server:

	```bash
	npm run dev
	```

5. Open `http://localhost:3000` in your browser.

To create the first admin account, set `ADMIN_EMAILS` to the email you want to elevate, then sign up through `/signup` using that same email.

## Environment Variables

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Connects Prisma and the app runtime to PostgreSQL. |
| `AUTH_SECRET` | Yes (prod) | NextAuth signing secret. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Base URL used by redirect routes and generated links. |
| `READER_TOKEN_SECRET` | Recommended | HMAC secret for canvas-reader tokens. A hardcoded dev fallback exists, but should not be used outside local development. |
| `ADMIN_EMAILS` | No | Comma-separated emails auto-promoted to `admin` on sign-in or sign-up. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Enables Google sign-in. Without them, email/password auth still works. |

## Data and Storage

- Articles, series, site config, videos, users, comments, and auth tables live in PostgreSQL through Prisma.
- Uploaded files are written to `public/uploads/` by the upload API routes.
- Rasterized page images are written to `storage/page-images/{slug}/page-N.png` and `storage/page-images/{slug}/manifest.json`.
- `storage/page-images/` is a generated artifact for the reader experience; do not treat it as hand-edited source.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run test
npm run rasterize
npm run rasterize -- --slug=<slug>
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
```

Authentication, RBAC, reader trial access, and admin surfaces are documented in [docs/auth-and-admin.md](docs/auth-and-admin.md).

## Project Structure

- `src/app/`: Next.js App Router pages, layouts, and API routes
- `src/components/`: reusable UI and editor components
- `src/lib/`: Prisma data access, caching, rasterization helpers, reader tokens, and shared utilities
- `prisma/`: schema and migrations
- `storage/page-images/`: generated rasterized page assets for the reader

## Notes

- This project uses the App Router on Next.js 16 and React 19.
- Rasterization uses Puppeteer and runs through `scripts/rasterize-articles.ts`; the Next.js runtime itself does not import Puppeteer.
- The reader fetches images with short-lived signed tokens from [src/lib/reader-token.ts](src/lib/reader-token.ts). Direct GETs of `/api/articles/.../image` without `?t=<token>` are rejected.
