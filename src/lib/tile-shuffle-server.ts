/**
 * Server-side PNG tile scrambler. Pure Node — uses `pngjs` to decode/encode.
 * Kept out of `tile-shuffle.ts` so the browser-bundled module stays free of
 * Node-only deps.
 */

import { PNG } from 'pngjs';
import { TILE_COLS, TILE_ROWS, TILE_COUNT } from './tile-shuffle';

/**
 * Rearrange the tiles of `pngBuffer` so that shuffled-tile[i] holds the
 * original tile at index `permutation[i]`. Returns a new PNG buffer of the
 * same dimensions.
 */
export function shufflePngTiles(pngBuffer: Buffer, permutation: number[]): Buffer {
  if (permutation.length !== TILE_COUNT) {
    throw new Error(`permutation length ${permutation.length} != ${TILE_COUNT}`);
  }
  const src = PNG.sync.read(pngBuffer);
  const { width, height, data } = src;

  // Dimensions must divide cleanly. The rasterize pipeline produces 512×768
  // at 2× DPR → 1024×1536 actual pixels, which divides by 4 in both axes.
  if (width % TILE_COLS !== 0 || height % TILE_ROWS !== 0) {
    throw new Error(`Image ${width}×${height} not divisible by ${TILE_COLS}×${TILE_ROWS}`);
  }

  const tileW = width / TILE_COLS;
  const tileH = height / TILE_ROWS;
  const out = new PNG({ width, height });

  for (let dstIdx = 0; dstIdx < TILE_COUNT; dstIdx++) {
    const srcIdx = permutation[dstIdx];
    const dstCol = dstIdx % TILE_COLS;
    const dstRow = Math.floor(dstIdx / TILE_COLS);
    const srcCol = srcIdx % TILE_COLS;
    const srcRow = Math.floor(srcIdx / TILE_COLS);

    for (let y = 0; y < tileH; y++) {
      const srcY = srcRow * tileH + y;
      const dstY = dstRow * tileH + y;
      const srcStart = (srcY * width + srcCol * tileW) * 4;
      const dstStart = (dstY * width + dstCol * tileW) * 4;
      data.copy(
        out.data,
        dstStart,
        srcStart,
        srcStart + tileW * 4,
      );
    }
  }

  return PNG.sync.write(out);
}
