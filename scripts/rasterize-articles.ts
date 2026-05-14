/**
 * rasterize-articles.ts — Standalone script to paginate & rasterize articles.
 *
 * Usage:
 *   npx tsx scripts/rasterize-articles.ts              # all published articles
 *   npx tsx scripts/rasterize-articles.ts --slug=abc    # single article
 */

import fs from 'fs';
import path from 'path';
import { rasterizeArticle } from '../src/lib/rasterize';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_DIR = path.join(DATA_DIR, 'articles');

interface ArticleJson {
  slug: string;
  title: string;
  content: string;
  status: string;
  pages?: Array<{ pageNumber: number; imageUrl: string }>;
  [key: string]: unknown;
}

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error('Thư mục data/articles không tồn tại.');
    process.exit(1);
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('Không có bài viết nào.');
    process.exit(0);
  }

  const articlesToProcess: ArticleJson[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8');
    const article = JSON.parse(raw) as ArticleJson;

    if (slugArg && article.slug !== slugArg) continue;
    if (article.status !== 'published') continue;
    if (!article.content || article.content.trim().length === 0) continue;

    articlesToProcess.push(article);
  }

  if (articlesToProcess.length === 0) {
    console.log(slugArg ? `Không tìm thấy bài viết: ${slugArg}` : 'Không có bài viết published nào.');
    process.exit(0);
  }

  console.log(`\n📖 Bắt đầu rasterize ${articlesToProcess.length} bài viết...\n`);

  for (const article of articlesToProcess) {
    try {
      console.log(`  ⏳ ${article.title} (${article.slug})...`);
      const { pages } = await rasterizeArticle(
        article.slug,
        article.content,
        article.title,
        (article.author as string | undefined) ?? '',
      );

      // Update the JSON file with page metadata
      article.pages = pages;
      const filePath = path.join(ARTICLES_DIR, `${article.slug}.json`);
      fs.writeFileSync(filePath, JSON.stringify(article, null, 2), 'utf-8');

      console.log(`  ✅ ${pages.length} trang đã tạo thành công.`);
    } catch (err) {
      console.error(`  ❌ Lỗi khi xử lý ${article.slug}:`, err);
    }
  }

  console.log('\n🎉 Hoàn tất rasterize!\n');
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
