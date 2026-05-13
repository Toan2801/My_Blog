import { promises as fs } from 'fs';
import path from 'path';
import type { RasterizedArticleAssets } from './types';

const PAGE_IMAGE_ROOT = path.join(process.cwd(), 'storage', 'page-images');
const MANIFEST_FILE = 'manifest.json';

function sanitizeSlug(slug: string): string {
  return path.basename(slug);
}

export function getRasterizedArticleDir(slug: string): string {
  return path.join(PAGE_IMAGE_ROOT, sanitizeSlug(slug));
}

export function getRasterizedManifestPath(slug: string): string {
  return path.join(getRasterizedArticleDir(slug), MANIFEST_FILE);
}

export async function readRasterizedArticleData(slug: string): Promise<RasterizedArticleAssets | null> {
  try {
    const raw = await fs.readFile(getRasterizedManifestPath(slug), 'utf8');
    const parsed = JSON.parse(raw) as Partial<RasterizedArticleAssets>;
    return {
      pages: Array.isArray(parsed.pages) ? parsed.pages : [],
      markdownPages: Array.isArray(parsed.markdownPages) ? parsed.markdownPages : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeRasterizedArticleData(
  slug: string,
  data: RasterizedArticleAssets,
): Promise<void> {
  const dir = getRasterizedArticleDir(slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    getRasterizedManifestPath(slug),
    JSON.stringify(
      {
        pages: data.pages,
        markdownPages: data.markdownPages,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
}

export async function deleteRasterizedArticleData(slug: string): Promise<void> {
  await fs.rm(getRasterizedArticleDir(slug), { recursive: true, force: true });
}