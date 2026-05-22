# Authentication, Authorization & Admin Dashboard

This document covers the current auth, RBAC, reader-access, and admin workflows.

## Overview

- **Authentication**: NextAuth v5 with Credentials and optional Google OAuth.
- **Persistence**: users, sessions, accounts, and verification tokens are stored in PostgreSQL through Prisma.
- **Session strategy**: JWT. `id` and `role` are projected onto `session.user` in [src/auth.ts](../src/auth.ts).
- **Authorization**: two roles, `admin` and `user`. Emails listed in `ADMIN_EMAILS` are auto-promoted on sign-in and sign-up.
- **RBAC enforcement**: [src/proxy.ts](../src/proxy.ts) protects `/admin/:path*` and `/api/admin/:path*`.
- **Reader access**: authenticated readers get full access; anonymous users can request a trial token limited to the first 5 pages through `/api/articles/[slug]/preview`.

## Environment Variables

Add to `.env.local`:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=<random-secret>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
READER_TOKEN_SECRET=<random-secret>
ADMIN_EMAILS=you@example.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## First Admin Setup

There is no seed script in this repository.

1. Set `ADMIN_EMAILS` to the address you want to elevate.
2. Start the app with `npm run dev`.
3. Sign up through `/signup` using that same email.

The signup route stores a bcrypt password hash and assigns `role: 'admin'` when the email matches `ADMIN_EMAILS`.

## User Flows

### Sign Up

`/signup` accepts name, email, password, and password confirmation. Validation is enforced by [src/lib/password-policy.ts](../src/lib/password-policy.ts) and [src/app/api/auth/signup/route.ts](../src/app/api/auth/signup/route.ts).

### Sign In

`/login` supports email/password plus optional Google sign-in. `callbackUrl` is honored after success.

### Profile Menu

[src/components/ProfileMenu.tsx](../src/components/ProfileMenu.tsx) shows:

- Anonymous users: a sign-in CTA.
- Authenticated users: avatar/name plus links for settings, the admin dashboard when applicable, and sign-out.

### Anonymous Reader Trial

Anonymous users can open `/read/<slug>?trial=1`, which fetches `/api/articles/[slug]/preview` and receives a token capped at the first 5 pages.

## Admin Surface

The admin UI lives under `/admin` and includes:

- `/admin`: dashboard.
- `/admin/books`: article management with on-demand reader availability notes.
- `/admin/articles/*`: create, edit, preview, publish, and delete flows.
- `/admin/series`, `/admin/settings`: supporting management surfaces.

## Reader Availability

Published articles are paginated and rendered as SVG on demand. There is no separate rasterization or pre-generation step in the admin workflow.

## API Surface

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/auth/[...nextauth]` | * | — | NextAuth handlers |
| `/api/auth/signup` | POST | — | Email/password registration |
| `/api/articles/[slug]/pages` | GET | session required | Issues a reader token |
| `/api/articles/[slug]/preview` | GET | none | Issues a trial token capped to 5 pages |
| `/api/articles/[slug]/page/[n]/image` | GET | token | Streams on-demand SVG pages |
| `/api/articles/[slug]/page/[n]/markdown` | GET | token | Streams per-page markdown |
| `/api/articles/[slug]/search` | GET | token | Searches on-demand page markdown |

## Tests

```bash
npm test
npm run test:watch
```

Relevant suites include reader-token issuance, password policy validation, preview-route behavior, and RBAC decisions.

## Known Constraints

- Email verification and password reset are not implemented.
- Admin promotion is environment-driven through `ADMIN_EMAILS` or direct database edits.
- The reader depends on token-gated, on-demand page generation; unpublished articles still cannot open in the book reader.
