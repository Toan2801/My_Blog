/**
 * Short-lived HMAC tokens that gate access to per-page image streams.
 *
 * Goal is anti-scraping, not access control: tokens are bound to a slug and
 * expire after a short window, so harvesting all image URLs of every article
 * requires repeatedly hitting the reader page and rotating tokens, instead
 * of one cheap directory crawl.
 */

import crypto from 'crypto';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const SECRET =
  process.env.READER_TOKEN_SECRET ||
  process.env.MONGODB_URI ||
  'history-blog-dev-secret-please-set-READER_TOKEN_SECRET';

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('base64url');
}

export function issueReaderToken(slug: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${slug}.${expiresAt}`;
  const sig = sign(payload);
  return { token: `${expiresAt}.${sig}`, expiresAt };
}

export function verifyReaderToken(slug: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const expiresAt = Number(token.slice(0, dot));
  const provided = token.slice(dot + 1);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expected = sign(`${slug}.${expiresAt}`);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}
