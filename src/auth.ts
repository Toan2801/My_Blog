import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
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

export type UserRole = 'admin' | 'user';

/** Env-var allowlist: emails on this list are auto-promoted to admin on every sign-in. */
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
  adapter: PrismaAdapter(prisma),
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

        const u = await prisma.user.findUnique({ where: { email } });
        if (!u || !u.passwordHash) return null;

        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) return null;

        return { id: u.id, email: u.email, name: u.name, image: u.image, role: u.role as UserRole };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return true;
      const email = user.email.toLowerCase();
      if (adminEmails().has(email)) {
        await prisma.user.updateMany({ where: { email }, data: { role: 'admin' } });
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
        const u = await prisma.user.findUnique({ where: { email: String(t.email).toLowerCase() } });
        if (u) {
          t.id = u.id;
          t.role = u.role as UserRole;
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
