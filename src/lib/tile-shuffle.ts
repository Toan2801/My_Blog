/**
 * tile-shuffle — deterministic per-page tile permutation.
 *
 * Used on the server to scramble rendered page PNGs before sending, and on
 * the client to unscramble them via canvas. The algorithm is intentionally
 * symmetric: server and browser derive the same permutation from
 * (token, slug, pageNumber) using SHA-256 (Web Crypto, available in modern
 * Node and all browsers).
 *
 * The goal is anti-scraping, not cryptographic secrecy: anyone with the
 * algorithm + a valid token can unshuffle, but a naive `wget` of the URL
 * returns a scrambled PNG that doesn't display as the original image. The
 * unscramble step must run JS that knows the layout, which raises the bar
 * above simple HTTP scraping.
 */

export const TILE_COLS = 4;
export const TILE_ROWS = 4;
export const TILE_COUNT = TILE_COLS * TILE_ROWS;

const enc = new TextEncoder();

async function sha256(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return new Uint8Array(buf);
}

/**
 * Build a deterministic seed long enough to drive a Fisher-Yates shuffle of
 * n positions. SHA-256 of the inputs is concatenated with SHA-256 of itself
 * until we have enough bytes — the same construction in Node and browser.
 */
async function deriveSeed(input: string, byteLen: number): Promise<Uint8Array> {
  const out = new Uint8Array(byteLen);
  let written = 0;
  let counter = 0;
  while (written < byteLen) {
    const chunk = await sha256(`${input}::${counter}`);
    const take = Math.min(chunk.length, byteLen - written);
    out.set(chunk.subarray(0, take), written);
    written += take;
    counter++;
  }
  return out;
}

/**
 * Permutation P where shuffled-position i holds original-position P[i].
 * Both server (encode) and client (decode) call this with the same inputs
 * and get the same array.
 */
export async function derivePermutation(
  token: string,
  slug: string,
  pageNumber: number,
): Promise<number[]> {
  const input = `${token}|${slug}|${pageNumber}`;
  // 15 swaps × 4 bytes per swap = 60 bytes, round up to 64 for safety.
  const seed = await deriveSeed(input, 64);

  const arr = Array.from({ length: TILE_COUNT }, (_, i) => i);
  let ptr = 0;
  for (let i = arr.length - 1; i > 0; i--) {
    const r =
      ((seed[ptr] << 24) |
        (seed[ptr + 1] << 16) |
        (seed[ptr + 2] << 8) |
        seed[ptr + 3]) >>> 0;
    ptr += 4;
    const j = r % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
