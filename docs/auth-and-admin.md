# Authentication, Authorization & Admin Dashboard

This document covers the auth/RBAC stack added in the auth feature and how to
set it up locally.

## Overview

- **Authentication**: [NextAuth v5 (beta)](https://authjs.dev) with two providers:
  - **Credentials** — email + bcrypt-hashed password, stored in `users` collection (Mongoose model: [`src/models/User.ts`](../src/models/User.ts)).
  - **Google OAuth** — `allowDangerousEmailAccountLinking: true` so a Google sign-in with the same email as an existing credentials account is linked to it.
- **Session strategy**: JWT (set on `auth.ts`). The session callback projects `id` and `role` onto `session.user`.
- **Authorization**: two roles, `admin` and `user`. Role lives on the User document. Emails listed in `ADMIN_EMAILS` are auto-promoted on every sign-in (idempotent).
- **RBAC enforcement**: [`src/middleware.ts`](../src/middleware.ts) matches `/admin/:path*` and `/api/admin/:path*`. Anonymous → login redirect (UI) or 401 (API). Authenticated non-admin → home redirect or 403.
- **Reader access**: the canvas reader requires authentication. Anonymous users can request a **trial token** capped to the first 5 pages via `/api/articles/[slug]/preview`. The HMAC reader token is now bound to the user id (or anonymous session id) + slug + expiry; old slug-only tokens no longer verify.

## Environment variables

Add to `.env.local`:

```bash
# NextAuth — generate with `openssl rand -base64 32`
AUTH_SECRET=<random-32-bytes>

# Google OAuth (optional — Credentials still works without these)
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Anti-scraping/access HMAC secret for reader tokens
READER_TOKEN_SECRET=<random-32-bytes>

# Comma-separated emails auto-promoted to admin on sign-in
ADMIN_EMAILS=admin@abc.com

# MongoDB connection (existing)
MONGODB_URI=mongodb+srv://...
# Optional: explicit DB name for the NextAuth adapter
MONGODB_DB=history-blog
```

## First-time setup

```bash
# 1. Install (already in package.json):
npm install

# 2. Seed the mock admin account.
npm run migrate:users
# → ✓ Created admin user admin@abc.com (password: Admin1234).
```

The seed is **idempotent** — re-running is safe.

## Mock admin account

| Field | Value |
|---|---|
| Email | `admin@abc.com` |
| Password | `Admin1234` |
| Role | `admin` |

Rotate the password by deleting the user document and re-running `migrate:users`, or edit `passwordHash` directly in MongoDB after running `bcryptjs.hashSync('new-pass', 12)`.

## User flows

### Sign up

`/signup` — full-name (optional), email, password, confirm. Password policy enforced both client-side and in [`src/lib/password-policy.ts`](../src/lib/password-policy.ts) (≥8 chars, upper, lower, digit, special). On success the user is auto-signed-in. Conflicting emails → 409 with a "Please sign in instead" message.

### Sign in

`/login` — Credentials form + "Đăng nhập với Google" button. The `callbackUrl` query parameter is honored after success.

### Profile dropdown

[`src/components/ProfileMenu.tsx`](../src/components/ProfileMenu.tsx) lives in the site header:
- Anonymous → "Đăng nhập" CTA.
- Authenticated → avatar + name, opens a dropdown with Settings, Admin Dashboard (admin-only), and Đăng xuất.

### Anonymous reader (Đọc thử)

The article page shows two buttons for anonymous users:
- **Đọc thử** → `/read/<slug>?trial=1` — fetches `/api/articles/<slug>/preview` (no auth required), gets a trial token capped at the first 5 pages.
- **Đăng nhập để đọc tiếp** → `/login?callbackUrl=/read/<slug>`.

Server-side, the canvas reader page (`/read/[slug]`) redirects anonymous visitors without `?trial=1` to login, and serves the trial reader otherwise.

## Admin dashboard

`/admin` is the landing page; `/admin/books` is the new book-master page that lists every article with:
- Rasterization status (`Rasterized` if `rasterizedAt >= updatedAt`, otherwise `Unrasterized`).
- Per-row **Rasterize** (POST `/api/admin/articles/<slug>/rasterize`), **Sửa** (link to existing editor), **Xoá** (confirmation prompt).
- Checkbox selection + **Batch Rasterize** that calls `POST /api/admin/articles/batch-rasterize` with `{ slugs: [...] }` and reports per-slug results.

The article edit page (`/admin/articles/<slug>/edit`) now shows a 🛠 **Rasterize** button in the header that runs the same single-slug endpoint and reports completion inline.

## Rasterization status

Each article has a new `rasterizedAt: Date | null` field on the schema ([`src/models/Article.ts`](../src/models/Article.ts)). The rasterize API routes set it to `new Date()` on completion. The "Rasterized vs Unrasterized" display reads:

```
isRasterized = rasterizedAt && updatedAt && rasterizedAt >= updatedAt
```

Editing an article bumps `updatedAt` (Mongoose `timestamps: true`), so any edit immediately flips status back to `Unrasterized` until you re-rasterize.

## API surface (changes)

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/auth/[...nextauth]` | * | — | NextAuth handlers |
| `/api/auth/signup` | POST | — | Email + password registration |
| `/api/articles/[slug]/pages` | GET | **session required** | Issues a user-bound reader token |
| `/api/articles/[slug]/preview` | GET | **none** | Issues a trial token capped to 5 pages |
| `/api/articles/[slug]/page/[n]/image` | GET | token | 401 invalid / 402 trial limit reached |
| `/api/articles/[slug]/page/[n]/markdown` | GET | token | Same |
| `/api/articles/[slug]/search` | GET | token | Trial searches only within first 5 pages |
| `/api/admin/articles/[slug]/rasterize` | POST | **admin** | Runs `rasterize-articles.ts`, sets `rasterizedAt` |
| `/api/admin/articles/batch-rasterize` | POST | **admin** | Body `{ slugs: [] }`; per-slug result list |

## Tests

```bash
npm test          # one-shot
npm run test:watch
```

Coverage today (19 tests, 4 files):

- `tests/reader-token.test.ts` — token issuance/verification for both user + trial flavors, page-cap enforcement, malformed-token rejection.
- `tests/password-policy.test.ts` — character-class rules, schema confirm-match, email normalization.
- `tests/preview-route.test.ts` — `/api/articles/[slug]/preview` integration: page count, isTrial flag, trial token cap, 404 for missing/draft.
- `tests/middleware-rbac.test.ts` — decision table for the RBAC middleware (anon vs user vs admin × UI vs API × admin vs non-admin paths).

## Migration order on a fresh DB

```bash
npm install
npm run migrate            # legacy article + config import
npm run migrate:users      # seed admin@abc.com
npm run rasterize          # generate page PNGs (sets rasterizedAt on success)
```

## Known follow-ups

- **Markdown-aware admin editor**: the existing TipTap-based RichTextEditor still works in HTML. Article `content` is now Markdown (per the HTML → Markdown migration), so editing an existing article would need an MD↔HTML round-trip on load/save. Quickest fix is a wrapper around `ArticleEditor` that calls `renderArticleMarkdown` on init and Turndown on save.
- **Settings page**: `/settings` link in the profile dropdown is a placeholder.
- **Email verification + password reset**: not implemented.
- **Admin promotion UI**: roles are currently changed via env (`ADMIN_EMAILS`) or direct DB edits.
