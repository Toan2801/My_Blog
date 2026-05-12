import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../src/models/Article';
import SiteConfig from '../src/models/SiteConfig';
import { rasterizeArticle } from '../src/lib/rasterize';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_DIR = path.join(DATA_DIR, 'articles');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

async function migrate() {
  if (!MONGODB_URI) {
    console.error('Lỗi: Không tìm thấy MONGODB_URI.');
    process.exit(1);
  }

  try {
    console.log('Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối!');

    // Cài đặt Site Config
    if (fs.existsSync(CONFIG_PATH)) {
      console.log('Đang lưu cấu hình trang web...');
      const rawConfig = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const configData = JSON.parse(rawConfig);
      await SiteConfig.deleteMany({});
      await SiteConfig.create(configData);
    }

    // Cài đặt Articles
    if (fs.existsSync(ARTICLES_DIR)) {
      const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));
      console.log(`Đã phát hiện ${files.length} bài viết. Đang tải lên máy chủ Cloud...`);
      
      for (const file of files) {
        const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8');
        const articleData = JSON.parse(raw);
        
        // Remove existing to avoid duplicates if rerun
        await Article.deleteOne({ slug: articleData.slug });
        await Article.create(articleData);
        console.log(`- Đã tải lên thành công: ${articleData.title}`);
      }
    }

    // Rasterize articles into page images
    console.log('\n📖 Đang rasterize bài viết thành trang sách...');
    if (fs.existsSync(ARTICLES_DIR)) {
      const articleFiles = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));
      for (const file of articleFiles) {
        const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8');
        const articleData = JSON.parse(raw);
        if (articleData.status !== 'published' || !articleData.content) continue;

        try {
          console.log(`  ⏳ ${articleData.title}...`);
          const { pages, markdownPages } = await rasterizeArticle(
            articleData.slug,
            articleData.content,
            articleData.title,
            articleData.author,
          );

          // Update JSON file with page + markdown metadata
          articleData.pages = pages;
          articleData.markdownPages = markdownPages;
          fs.writeFileSync(path.join(ARTICLES_DIR, file), JSON.stringify(articleData, null, 2), 'utf-8');

          // Update MongoDB document too
          await Article.updateOne(
            { slug: articleData.slug },
            { $set: { pages, markdownPages } },
          );

          console.log(`  ✅ ${pages.length} trang (ảnh + markdown).`);
        } catch (err) {
          console.error(`  ❌ Lỗi khi rasterize ${articleData.slug}:`, err);
        }
      }
    }

    console.log('=================================');
    console.log('CHÚC MỪNG MIGRATION THÀNH CÔNG!');
    console.log('Tất cả dữ liệu đã được sao lưu an toàn lên Đám mây.');
    process.exit(0);

  } catch (err) {
    console.error('Đã xảy ra sự cố:', err);
    process.exit(1);
  }
}

migrate();
