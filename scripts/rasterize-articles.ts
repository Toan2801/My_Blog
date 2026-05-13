/**
 * rasterize-articles.ts — Standalone script to paginate & rasterize articles.
 *
 * Usage:
 *   npx tsx scripts/rasterize-articles.ts              # all published articles
 *   npx tsx scripts/rasterize-articles.ts --slug=abc    # single article
 */

import { config } from 'dotenv';
import { rasterizeArticle } from '../src/lib/rasterize';

config({ path: '.env.local' });
config();

async function main() {
  const { default: prisma } = await import('../src/lib/prisma');
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];

  const where = slugArg
    ? { slug: slugArg, status: 'published' }
    : { status: 'published' };

  const articles = await prisma.article.findMany({
    where,
    select: {
      slug: true,
      title: true,
      author: true,
      content: true,
    },
  });

  if (articles.length === 0) {
    console.log(slugArg ? `Không tìm thấy bài viết: ${slugArg}` : 'Không có bài viết published nào.');
    process.exit(0);
  }

  const articlesToProcess = articles.filter(a => a.content && a.content.trim().length > 0);

  if (articlesToProcess.length === 0) {
    console.log('Không có bài viết nào có nội dung.');
    process.exit(0);
  }

  console.log(`\n📖 Bắt đầu rasterize ${articlesToProcess.length} bài viết...\n`);

  for (const article of articlesToProcess) {
    try {
      console.log(`  ⏳ ${article.title} (${article.slug})...`);
      const { pages, markdownPages } = await rasterizeArticle(
        article.slug,
        article.content,
        article.title,
        article.author ?? '',
      );

      await prisma.article.update({
        where: { slug: article.slug },
        data: {
          rasterizedAt: new Date(),
        },
        select: { slug: true },
      });

      console.log(`  ✅ ${pages.length} trang (ảnh + markdown) đã tạo thành công.`);
    } catch (err) {
      console.error(`  ❌ Lỗi khi xử lý ${article.slug}:`, err);
    }
  }

  await prisma.$disconnect();
  console.log('\n🎉 Hoàn tất rasterize!\n');
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
