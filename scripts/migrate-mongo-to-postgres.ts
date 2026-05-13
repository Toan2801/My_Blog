/**
 * migrate-mongo-to-postgres.ts
 *
 * Migrates all data from MongoDB to PostgreSQL via Prisma.
 *
 * What it migrates:
 *   - Users (with passwordHash and role)
 *   - NextAuth accounts, sessions, verification tokens
 *   - Articles (with content/editor fields in PostgreSQL)
 *   - Rasterized page data written to storage/page-images/<slug>/manifest.json
 *   - Series
 *   - Site config
 *   - Videos
 *   - Comments
 *
 * Prerequisites:
 *   - MONGODB_URI must point to the source MongoDB instance
 *   - DATABASE_URL must point to the target PostgreSQL instance
 *   - Run `npx prisma migrate deploy` before running this script
 *
 * Usage:
 *   npx tsx scripts/migrate-mongo-to-postgres.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { MongoClient, ObjectId } from 'mongodb';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import { writeRasterizedArticleData } from '../src/lib/raster-data';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const MONGODB_DB = process.env.MONGODB_DB || 'history-blog';

function mongoIdToString(id: ObjectId | string | undefined): string {
  if (!id) return '';
  return id instanceof ObjectId ? id.toHexString() : String(id);
}

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log('\n🚀 Starting MongoDB → PostgreSQL migration...\n');

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  const db = client.db(MONGODB_DB);

  // ─── 1. Users ──────────────────────────────────────────────────────────────
  console.log('📥 Migrating users...');
  const users = await db.collection('users').find({}).toArray();
  let userCount = 0;
  for (const u of users) {
    try {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name ?? null,
          image: u.image ?? null,
          emailVerified: u.emailVerified ?? null,
          passwordHash: u.passwordHash ?? null,
          role: u.role ?? 'user',
        },
        create: {
          id: mongoIdToString(u._id),
          email: u.email,
          name: u.name ?? null,
          image: u.image ?? null,
          emailVerified: u.emailVerified ?? null,
          passwordHash: u.passwordHash ?? null,
          role: u.role ?? 'user',
          createdAt: u.createdAt ?? new Date(),
          updatedAt: u.updatedAt ?? new Date(),
        },
      });
      userCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipped user ${u.email}: ${e}`);
    }
  }
  console.log(`  ✅ ${userCount} users migrated.\n`);

  // Build a map from MongoDB ObjectId string → PostgreSQL user id
  const mongoToPostgresUserId = new Map<string, string>();
  for (const u of users) {
    const mongoId = mongoIdToString(u._id);
    const pgUser = await prisma.user.findUnique({ where: { email: u.email } });
    if (pgUser) mongoToPostgresUserId.set(mongoId, pgUser.id);
  }

  // ─── 2. Accounts (OAuth) ───────────────────────────────────────────────────
  console.log('📥 Migrating OAuth accounts...');
  const accounts = await db.collection('accounts').find({}).toArray();
  let accountCount = 0;
  for (const a of accounts) {
    const userId = mongoToPostgresUserId.get(mongoIdToString(a.userId));
    if (!userId) {
      console.warn(`  ⚠ Skipped account (no matching user): ${a.provider}`);
      continue;
    }
    try {
      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: a.provider,
            providerAccountId: a.providerAccountId,
          },
        },
        update: {},
        create: {
          userId,
          type: a.type,
          provider: a.provider,
          providerAccountId: a.providerAccountId,
          refresh_token: a.refresh_token ?? null,
          access_token: a.access_token ?? null,
          expires_at: a.expires_at ?? null,
          token_type: a.token_type ?? null,
          scope: a.scope ?? null,
          id_token: a.id_token ?? null,
          session_state: a.session_state ?? null,
        },
      });
      accountCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipped account ${a.provider}/${a.providerAccountId}: ${e}`);
    }
  }
  console.log(`  ✅ ${accountCount} accounts migrated.\n`);

  // ─── 3. Sessions ───────────────────────────────────────────────────────────
  console.log('📥 Migrating sessions...');
  const sessions = await db.collection('sessions').find({}).toArray();
  let sessionCount = 0;
  for (const s of sessions) {
    const userId = mongoToPostgresUserId.get(mongoIdToString(s.userId));
    if (!userId) continue;
    try {
      await prisma.session.upsert({
        where: { sessionToken: s.sessionToken },
        update: {},
        create: {
          sessionToken: s.sessionToken,
          userId,
          expires: new Date(s.expires),
        },
      });
      sessionCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipped session: ${e}`);
    }
  }
  console.log(`  ✅ ${sessionCount} sessions migrated.\n`);

  // ─── 4. Verification tokens ────────────────────────────────────────────────
  console.log('📥 Migrating verification tokens...');
  const vtokens = await db.collection('verification_tokens').find({}).toArray();
  let vtCount = 0;
  for (const vt of vtokens) {
    try {
      await prisma.verificationToken.upsert({
        where: { identifier_token: { identifier: vt.identifier, token: vt.token } },
        update: {},
        create: {
          identifier: vt.identifier,
          token: vt.token,
          expires: new Date(vt.expires),
        },
      });
      vtCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipped verification token: ${e}`);
    }
  }
  console.log(`  ✅ ${vtCount} verification tokens migrated.\n`);

  // ─── 5. Articles ───────────────────────────────────────────────────────────
  console.log('📥 Migrating articles...');
  const articles = await db.collection('articles').find({}).toArray();
  let articleCount = 0;
  for (const a of articles) {
    try {
      const data = {
        title: a.title ?? '',
        subtitle: a.subtitle ?? null,
        excerpt: a.excerpt ?? '',
        content: a.content ?? '',
        category: a.category ?? null,
        type: a.type ?? 'articles',
        tags: a.tags ?? [],
        series: a.series ?? null,
        seriesOrder: a.seriesOrder ?? null,
        date: a.date ?? new Date().toISOString().split('T')[0],
        featured: a.featured ?? false,
        author: a.author ?? '',
        coverImage: a.coverImage ?? null,
        status: a.status ?? 'draft',
        readingTime: a.readingTime ?? 0,
        footnotes: a.footnotes ?? undefined,
        rasterizedAt: a.rasterizedAt ? new Date(a.rasterizedAt) : null,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
        updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
      };
      await prisma.article.upsert({
        where: { slug: a.slug },
        update: data,
        create: { slug: a.slug, ...data },
      });
      if (Array.isArray(a.pages) || Array.isArray(a.markdownPages)) {
        await writeRasterizedArticleData(a.slug, {
          pages: Array.isArray(a.pages) ? a.pages : [],
          markdownPages: Array.isArray(a.markdownPages) ? a.markdownPages : [],
        });
      }
      articleCount++;
    } catch (e) {
      console.warn(`  ⚠ Skipped article ${a.slug}: ${e}`);
    }
  }
  console.log(`  ✅ ${articleCount} articles migrated.\n`);

  // ─── 6. Series (from JSON files if MongoDB doesn't have them) ──────────────
  console.log('📥 Migrating series from data/series/*.json...');
  const fs = await import('fs');
  const path = await import('path');
  const SERIES_DIR = path.join(process.cwd(), 'data', 'series');
  let seriesCount = 0;
  if (fs.existsSync(SERIES_DIR)) {
    const seriesFiles = fs.readdirSync(SERIES_DIR).filter((f: string) => f.endsWith('.json'));
    for (const file of seriesFiles) {
      try {
        const raw = fs.readFileSync(path.join(SERIES_DIR, file), 'utf-8');
        const s = JSON.parse(raw);
        const data = {
          title: s.title ?? '',
          description: s.description ?? '',
          coverImage: s.coverImage ?? null,
          type: s.type ?? 'articles',
          category: s.category ?? null,
          status: s.status ?? 'draft',
          featured: s.featured ?? false,
        };
        await prisma.series.upsert({
          where: { slug: s.slug },
          update: data,
          create: { slug: s.slug, ...data },
        });
        seriesCount++;
      } catch (e) {
        console.warn(`  ⚠ Skipped series file ${file}: ${e}`);
      }
    }
  }
  console.log(`  ✅ ${seriesCount} series migrated.\n`);

  // ─── 7. Site config (from data/config.json) ────────────────────────────────
  console.log('📥 Migrating site config from data/config.json...');
  const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(raw);
      await prisma.siteConfig.upsert({
        where: { id: 1 },
        update: { data: config },
        create: { id: 1, data: config },
      });
      console.log('  ✅ Site config migrated.\n');
    } catch (e) {
      console.warn(`  ⚠ Could not migrate config: ${e}\n`);
    }
  } else {
    console.log('  ℹ No config.json found, skipping.\n');
  }

  // ─── 8. Videos (from data/videos.json) ────────────────────────────────────
  console.log('📥 Migrating videos from data/videos.json...');
  const VIDEOS_PATH = path.join(process.cwd(), 'data', 'videos.json');
  let videoCount = 0;
  if (fs.existsSync(VIDEOS_PATH)) {
    try {
      const raw = fs.readFileSync(VIDEOS_PATH, 'utf-8');
      const videos = JSON.parse(raw);
      for (const v of videos) {
        await prisma.video.upsert({
          where: { id: v.id },
          update: { title: v.title, url: v.url, description: v.description ?? '' },
          create: { id: v.id, title: v.title, url: v.url, description: v.description ?? '' },
        });
        videoCount++;
      }
    } catch (e) {
      console.warn(`  ⚠ Could not migrate videos: ${e}`);
    }
  }
  console.log(`  ✅ ${videoCount} videos migrated.\n`);

  // ─── 9. Comments (from data/comments/*.json) ──────────────────────────────
  console.log('📥 Migrating comments from data/comments/...');
  const COMMENTS_DIR = path.join(process.cwd(), 'data', 'comments');
  let commentCount = 0;
  if (fs.existsSync(COMMENTS_DIR)) {
    const commentFiles = fs.readdirSync(COMMENTS_DIR).filter((f: string) => f.endsWith('.json'));
    for (const file of commentFiles) {
      const slug = file.replace('.json', '');
      try {
        const raw = fs.readFileSync(path.join(COMMENTS_DIR, file), 'utf-8');
        const comments = JSON.parse(raw);
        for (const c of comments) {
          await prisma.comment.upsert({
            where: { id: c.id },
            update: {},
            create: {
              id: c.id,
              articleSlug: slug,
              author: c.author,
              text: c.text,
              createdAt: c.date ? new Date(c.date) : new Date(),
            },
          });
          commentCount++;
        }
      } catch (e) {
        console.warn(`  ⚠ Skipped comments for ${slug}: ${e}`);
      }
    }
  }
  console.log(`  ✅ ${commentCount} comments migrated.\n`);

  await client.close();
  await prisma.$disconnect();

  console.log('🎉 Migration complete!\n');
  console.log('Summary:');
  console.log(`  Users:               ${userCount}`);
  console.log(`  OAuth accounts:      ${accountCount}`);
  console.log(`  Sessions:            ${sessionCount}`);
  console.log(`  Verification tokens: ${vtCount}`);
  console.log(`  Articles:            ${articleCount}`);
  console.log(`  Series:              ${seriesCount}`);
  console.log(`  Videos:              ${videoCount}`);
  console.log(`  Comments:            ${commentCount}`);
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
