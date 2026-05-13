import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User, { type UserRole } from '@/models/User';
import clientPromise from '@/lib/mongo-client';
import authConfig from '@/auth.config';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
  interface User {
    role?: UserRole;
  }
}

// JWT augmentation lives in the `next-auth` module in v5 beta.

/** Env-var allowlist: emails on this list are auto-promoted to admin on first sign-in. */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || 'admin@abc.com')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise, { databaseName: process.env.MONGODB_DB }),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Email & mật khẩu',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').toLowerCase().trim();
        const password = String(credentials?.password || '');
        if (!email || !password) return null;

        await dbConnect();
        const u = await User.findOne({ email });
        if (!u || !u.passwordHash) return null;

        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) return null;

        return { id: u._id.toString(), email: u.email, name: u.name, image: u.image, role: u.role };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Link Google sign-in to an existing Credentials account if the email matches.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Promote allow-listed emails to admin on every sign-in (idempotent).
      if (!user.email) return true;
      const email = user.email.toLowerCase();
      if (adminEmails().has(email)) {
        await dbConnect();
        await User.updateOne({ email }, { $set: { role: 'admin' } });
      }
      return true;
    },
    async jwt({ token, user }) {
      const t = token as { id?: string; role?: UserRole; sub?: string; email?: string | null };
      if (user) {
        t.id = (user as { id?: string }).id ?? t.sub;
        t.role = (user as { role?: UserRole }).role ?? 'user';
      }
      if (!t.role && t.email) {
        await dbConnect();
        const u = await User.findOne({ email: String(t.email).toLowerCase() });
        if (u) {
          t.id = u._id.toString();
          t.role = u.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as { id?: string; role?: UserRole; sub?: string };
      if (session.user) {
        session.user.id = t.id ?? t.sub ?? '';
        session.user.role = (t.role ?? 'user') as UserRole;
      }
      return session;
    },
  },
});
