/**
 * migrate-users.ts — Seed the User collection and ensure indexes.
 *
 * Idempotent. Always seeds the admin@abc.com mock account (per spec) with the
 * literal password Admin1234 if it doesn't already exist.
 *
 * Usage:
 *   npx tsx scripts/migrate-users.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = 'admin@abc.com';
const ADMIN_PASSWORD = 'Admin1234';

async function main() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Ensure email index exists (Mongoose declared `unique: true`, but indexes are async).
  await User.init();
  console.log('User indexes ensured.');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      await User.updateOne({ _id: existing._id }, { $set: { role: 'admin' } });
      console.log(`✓ Promoted ${ADMIN_EMAIL} to admin.`);
    } else {
      console.log(`· ${ADMIN_EMAIL} already exists and is admin — skipping.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      email: ADMIN_EMAIL,
      name: 'Admin',
      passwordHash,
      role: 'admin',
    });
    console.log(`✓ Created admin user ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD}).`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
