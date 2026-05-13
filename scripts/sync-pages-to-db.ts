/**
 * sync-pages-to-db.ts — Push the latest pages + markdownPages from JSON
 * files into MongoDB without re-rasterizing.
 *
 * Usage: npx tsx scripts/sync-pages-to-db.ts
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../src/models/Article';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const ARTICLES_DIR = path.join(process.cwd(), 'data', 'articles');

async function main() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.json'));
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8');
    const data = JSON.parse(raw);
    if (!data.pages || !data.markdownPages) {
      skipped++;
      continue;
    }
    await Article.updateOne(
      { slug: data.slug },
      { $set: { pages: data.pages, markdownPages: data.markdownPages } },
    );
    updated++;
    console.log(`  ✓ ${data.slug} — ${data.pages.length} pages, ${data.markdownPages.length} md pages`);
  }

  console.log(`\nDone. Updated ${updated}, skipped ${skipped}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
