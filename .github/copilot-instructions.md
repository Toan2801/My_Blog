# Project Instructions

## Overview

- This is a Next.js 16 App Router project using React 19, TypeScript, and Mongoose.
- The site is a Vietnamese history publication with long-form original articles, translated texts, article series, videos, author/support pages, and an admin interface for managing content.
- The project uses a mixed storage model: most authoring flows write to JSON files in `data/`, while MongoDB is used by the migration workflow and server-side database code.

## Actual Project Structure

### Routing Surface

- `src/app/page.tsx`: homepage with featured original articles, featured translations, and featured series.
- `src/app/articles/page.tsx`: article listing and filtering UI.
- `src/app/articles/[slug]/page.tsx`: article detail page with table of contents, reading progress, comments, support QR, and voice reader.
- `src/app/series/[slug]/page.tsx`: series landing pages for grouped article content.
- `src/app/translations/`: translated content landing surface.
- `src/app/videos/`: public video listing page backed by `data/videos.json`.
- `src/app/contact/`: contact page.

### Admin Surface

- `src/app/admin/page.tsx`: admin dashboard.
- `src/app/admin/articles/`: create, edit, list, preview, and delete article content.
- `src/app/admin/series/`: manage series metadata.
- `src/app/admin/videos/`: manage embedded videos stored in `data/videos.json`.
- `src/app/admin/settings/page.tsx`: edit site configuration, homepage quote block, categories, donation text, and QR image path.
- `src/app/admin/donation/`: donation-specific admin screen.

### API Surface

- `src/app/api/articles/route.ts`: reads and writes article JSON files through `src/lib/data.ts`.
- `src/app/api/series/route.ts`: reads and writes series JSON files.
- `src/app/api/config/route.ts`: reads and updates `data/config.json`.
- `src/app/api/admin/videos/route.ts`: reads and writes `data/videos.json`.
- `src/app/api/upload/route.ts` and `src/app/api/upload-qr/route.ts`: save uploaded files under `public/uploads/`.
- `src/app/api/comments/`: comment-related server endpoints.

### Shared Logic and Models

- `src/lib/data.ts`: primary filesystem-backed content store for articles, series, and site config.
- `src/lib/video-data.ts`: filesystem-backed store for video entries.
- `src/lib/mongoose.ts`: MongoDB connection helper. This module throws immediately when `MONGODB_URI` is missing.
- `src/lib/types.ts`: shared TypeScript interfaces for articles, footnotes, series, and site config.
- `src/models/Article.ts` and `src/models/SiteConfig.ts`: Mongoose schemas used by migration and database-backed code.

### Reusable Components

- `src/components/ArticleEditor.tsx` and `src/components/RichTextEditor.tsx`: admin editing experience built around Tiptap.
- `src/components/ArticleBody.tsx`, `TableOfContents.tsx`, `ReadingProgress.tsx`, and `FontSizeControl.tsx`: article reading experience.
- `src/components/VoiceReader.tsx`: text-to-speech UI.
- `src/components/SupportQR.tsx`: donation/support module.
- `src/components/SeriesEditor.tsx`: series editing workflow.

### Content and Assets

- `data/articles/*.json`: the source of truth for article bodies, metadata, tags, series membership, featured flags, and publication status.
- `data/series/*.json`: series metadata used to group article collections.
- `data/config.json`: site-wide configuration including blog branding, author info, categories, homepage quote block, and donation settings.
- `data/videos.json`: public/admin video entries.
- `public/uploads/`: uploaded article images, donation QR images, and other local media.

## Storage and Content Model

- Articles and series are edited through the admin UI but are persisted to JSON files, not directly to MongoDB.
- Site settings are also persisted to JSON through `src/app/api/config/route.ts`.
- Videos are stored separately in `data/videos.json` through `src/lib/video-data.ts`.
- The current migration script only migrates `data/config.json` and `data/articles/*.json` into MongoDB.
- Series JSON files and videos are not migrated by `scripts/migrate.ts` at the moment, so do not assume MongoDB is the complete source of truth for all content.
- Uploaded files are stored on disk under `public/uploads/`, and the upload routes create the directory if it does not already exist.

## Local Environment Setup

### Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- MongoDB Community Server installed locally or a reachable remote MongoDB instance.

### Local MongoDB on This Windows Machine

- MongoDB Server 8.3.1 is installed.
- The Windows service name is `MongoDB`.
- The service is configured to start automatically and was verified running during setup.
- Default local connection string for this machine: `mongodb://127.0.0.1:27017/history-blog`.

### Environment File

Create `.env.local` from `.env.example` and keep at least these values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/history-blog
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Notes:

- `MONGODB_URI` is required because `src/lib/mongoose.ts` fails fast when it is missing.
- `NEXT_PUBLIC_SITE_URL` is used by redirect routes and should point to the currently running environment.

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

## Migration Workflow

### Command

Run:

```bash
npm run migrate
```

### What the Script Does

- `scripts/migrate.ts` loads `.env.local` using `dotenv`.
- It connects to MongoDB using `MONGODB_URI`.
- It reads site configuration from `data/config.json`.
- It deletes existing `SiteConfig` documents and inserts the current config JSON.
- It reads every JSON file in `data/articles/`.
- For each article, it deletes any existing MongoDB document with the same slug, then inserts the JSON payload into the `Article` collection.

### Important Migration Limitations

- The script does not currently migrate `data/series/*.json`.
- The script does not currently migrate `data/videos.json`.
- The script currently logs messages that mention MongoDB Atlas, but it works with local MongoDB as long as `MONGODB_URI` points at the local instance.

## Editing Guidance

- Preserve the App Router structure. Do not reintroduce Pages Router patterns.
- When editing article flows, keep `data/articles/*.json`, `src/lib/types.ts`, API request payloads, and Mongoose article fields aligned.
- When editing series flows, keep article `series` and `seriesOrder` usage consistent with `data/series/*.json` and the series APIs.
- When editing settings flows, preserve the schema used in `data/config.json` and `src/app/admin/settings/page.tsx`.
- When editing video flows, keep `data/videos.json`, `src/lib/video-data.ts`, and `src/app/api/admin/videos/route.ts` in sync.
- Prefer minimal changes that preserve existing Vietnamese content, editorial formatting, and slugs.
- Treat `public/uploads/` as local storage, not a generated cache.

## Validation Expectations

- Run `npm run lint` after code changes when practical.
- Run `npm run build` for routing, API, server, or production-facing changes.
- If your change affects migrations or MongoDB-backed code, confirm that `MONGODB_URI` resolves to a reachable database before treating runtime failures as code defects.