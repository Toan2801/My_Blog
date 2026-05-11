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

- Source content for migrations lives in `data/`.
- Uploaded files are written to `public/uploads/` by the upload API routes.
- The app expects `public/uploads/` to remain writable during local development.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run migrate
```

`npm run migrate` imports the JSON content from `data/` into MongoDB using `scripts/migrate.ts`.

## Project Structure

- `src/app/`: Next.js App Router pages, layouts, and API routes
- `src/components/`: Reusable UI and editor components
- `src/lib/`: Data access, utilities, and MongoDB connection logic
- `src/models/`: Mongoose models
- `data/`: Seed content and configuration JSON files

## Notes

- This project uses the App Router on Next.js 16 and React 19.
- If MongoDB is not configured, server code that imports `src/lib/mongoose.ts` will fail fast by design.
