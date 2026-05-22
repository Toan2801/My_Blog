# Project Instructions

## Overview

- This is a Next.js 16 App Router project using React 19, TypeScript, Prisma, and PostgreSQL.
- The site is a Vietnamese history publication with long-form original articles, article series, a canvas-based reader, and an admin interface for managing content.
- Runtime data lives in PostgreSQL. Uploaded media is stored on disk under `public/uploads/`.

## Actual Project Structure

### Routing Surface

- `src/app/page.tsx`: homepage with featured and recent articles.
- `src/app/articles/[slug]/page.tsx`: article detail page.
- `src/app/read/[slug]/page.tsx`: authenticated or trial reader surface backed by on-demand SVG page generation.
- `src/app/series/[slug]/page.tsx`: series landing pages.

### Admin Surface

- `src/app/admin/page.tsx`: admin dashboard.
- `src/app/admin/books/`: article-management dashboard for reader availability and article maintenance.
- `src/app/admin/articles/`: create, edit, list, preview, and delete article content.
- `src/app/admin/series/`: manage series metadata.
- `src/app/admin/settings/page.tsx`: edit site configuration, homepage quote block, categories, and core site metadata.

### API Surface

- `src/app/api/articles/route.ts`: creates and updates articles through `src/lib/data.ts`.
- `src/app/api/series/route.ts`: reads and writes series records.
- `src/app/api/config/route.ts`: reads and updates site configuration.
- `src/app/api/auth/signup/route.ts`: email/password account creation.
- `src/app/api/upload/route.ts`: saves uploaded files under `public/uploads/`.
- `src/app/api/comments/`: comment-related server endpoints.

### Shared Logic and Models

- `src/lib/data.ts`: primary Prisma-backed content store for articles, series, and site config.
- `src/lib/public-data.ts`: cached public data accessors used by the public site.
- `src/lib/prisma.ts`: shared Prisma client bootstrap. This module throws immediately when `DATABASE_URL` is missing.
- `src/lib/reader-pages.tsx`: on-demand markdown pagination and Satori SVG page generation for the reader.
- `src/lib/types.ts`: shared TypeScript interfaces for articles, footnotes, series, and site config.
- `src/auth.ts`, `src/auth.config.ts`, and `src/proxy.ts`: authentication and RBAC entry points.

### Reusable Components

- `src/components/DiscordArticleEditor.tsx` and `src/components/DiscordMarkdownEditor.tsx`: admin editing experience.
- `src/components/CanvasReader.tsx`: book-style reading experience for on-demand SVG pages.
- `src/components/SeriesEditor.tsx`: series editing workflow.

### Content and Assets

- `prisma/schema.prisma`: source of truth for the database schema.
- `src/generated/prisma/`: generated Prisma client output.
- `public/uploads/`: uploaded article images and other local media.

## Storage and Content Model

- Articles, series, site config, users, auth tables, and comments are persisted through Prisma.
- Uploaded files are stored on disk under `public/uploads/`.
- Reader page SVGs and per-page markdown are generated on demand and served through token-gated API routes.
- Uploaded files are stored on disk under `public/uploads/`, and the upload routes create the directory if it does not already exist.

## Local Environment Setup

### Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- A reachable PostgreSQL database.

### Environment File

Create `.env.local` and keep at least these values:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=replace-with-a-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Notes:

- `DATABASE_URL` is required because `src/lib/prisma.ts` fails fast when it is missing.
- `NEXT_PUBLIC_SITE_URL` is used by redirect routes and should point to the currently running environment.
- `READER_TOKEN_SECRET`, `ADMIN_EMAILS`, and Google OAuth credentials are optional but commonly used in local development.

### Install Dependencies

Run:

```bash
npm install
```

The repository already includes `tsx` as a dev dependency so the TypeScript migration script can run directly.

## Running the Project

### Development Server

Run:

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Production Build Check

Run:

```bash
npm run build
```

Use this for changes that affect routing, server behavior, or deployment behavior.

### Linting

Run:

```bash
npm run lint
```

The project currently has pre-existing lint failures in unrelated application files. Do not assume a lint failure is caused by your current change unless the error points at the file you just touched.

## Reader Generation Workflow

- The reader paginates article markdown on demand using `src/lib/reader-pages.tsx`.
- Individual pages are rendered as SVG through Satori in `/api/articles/[slug]/page/[n]/image`.
- Page SVGs and page markdown are gated by short-lived reader tokens.

## Editing Guidance

- Preserve the App Router structure. Do not reintroduce Pages Router patterns.
- When editing article flows, keep `prisma/schema.prisma`, `src/lib/types.ts`, and API request payloads aligned.
- When editing series, site config, or video flows, keep the Prisma schema and the corresponding `src/lib/*data.ts` helpers aligned.
- Prefer minimal changes that preserve existing Vietnamese content, editorial formatting, and slugs.
- Treat `public/uploads/` as local storage, not a generated cache.
- For UI styling, use only Tailwind CSS utility classes and pre-defined custom utilities from `src/app/globals.css`.
- Avoid inline styles or new ad-hoc CSS selectors unless explicitly requested for a task.

## Validation Expectations

- Run `npm run lint` after code changes when practical.
- Run `npm run build` for routing, API, server, or production-facing changes.
- If your change affects Prisma-backed code, confirm that `DATABASE_URL` resolves to a reachable database before treating runtime failures as code defects.