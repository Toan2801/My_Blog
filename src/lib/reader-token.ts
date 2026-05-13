/**
 * Reader tokens — short-lived HMAC bearer tokens that gate per-page image streams.
 *
 * Two flavors:
 *   - user:<userId>.<slug>.<expiry>     → authenticated reader, full book.
 *   - trial:<sessionId>.<slug>.<expiry> → anonymous reader, capped at TRIAL_MAX_PAGES.
 *
 * Goal: access control AND anti-scraping. Tokens are signed (HMAC-SHA256) with
 * READER_TOKEN_SECRET so a leaked token for one user can't be reused for a
 * different slug or past its expiry.
 */

import crypto from 'crypto';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const TRIAL_MAX_PAGES = 5;
const SECRET =
  process.env.READER_TOKEN_SECRET ||
  'history-blog-dev-secret-please-set-READER_TOKEN_SECRET';

export type ReaderTokenKind = 'user' | 'trial';

export interface ReaderTokenInfo {
  kind: ReaderTokenKind;
  subject: string; // userId or anonymous sessionId
  slug: string;
  expiresAt: number;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function build(kind: ReaderTokenKind, subject: string, slug: string, expiresAt: number): string {
  const payload = `${kind}:${subject}.${slug}.${expiresAt}`;
  const sig = sign(payload);
  return `${kind}:${subject}.${expiresAt}.${sig}`;
}

/** Issue a token for an authenticated user. */
export function issueUserReaderToken(userId: string, slug: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return { token: build('user', userId, slug, expiresAt), expiresAt };
}

/** Issue an anonymous trial token. `sessionId` should be a random per-visitor id. */
export function issueTrialReaderToken(sessionId: string, slug: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return { token: build('trial', sessionId, slug, expiresAt), expiresAt };
}

/** Returns null if the token is invalid/expired or doesn't match `slug`. */
export function verifyReaderToken(slug: string, token: string | null | undefined): ReaderTokenInfo | null {
  if (!token) return null;
  // Format: kind:subject.expiresAt.sig
  const m = token.match(/^(user|trial):([^.]+)\.(\d+)\.([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  const [, kind, subject, expiresAtStr, sig] = m;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  const expected = sign(`${kind}:${subject}.${slug}.${expiresAt}`);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  } catch {
    return null;
  }
  return { kind: kind as ReaderTokenKind, subject, slug, expiresAt };
}

/** Is the requested page within reach of the given token? */
export function tokenAllowsPage(info: ReaderTokenInfo, pageNumber: number): boolean {
  if (info.kind === 'user') return true;
  return pageNumber >= 1 && pageNumber <= TRIAL_MAX_PAGES;
}
