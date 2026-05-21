/**
 * Edge-safe NextAuth config slice — imported by src/proxy.ts, which runs on
 * the Edge runtime and must not pull in Node-only dependencies such as the
 * Prisma adapter, Prisma client, or bcryptjs. The full config in src/auth.ts
 * adds the providers and database-backed callbacks.
 */
import type { NextAuthConfig } from 'next-auth';

export default {
  pages: { signIn: '/login' },
  // No providers here — middleware doesn't need to know about them. The full
  // auth.ts adds Credentials + Google.
  providers: [],
  // Same session/jwt projection used everywhere, so middleware sees `role`
  // on req.auth.user the same way server components and API routes do.
  callbacks: {
    async jwt({ token, user }) {
      const t = token as { id?: string; role?: 'admin' | 'user'; sub?: string };
      if (user) {
        t.id = (user as { id?: string }).id ?? t.sub;
        t.role = ((user as { role?: 'admin' | 'user' }).role ?? 'user');
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as { id?: string; role?: 'admin' | 'user'; sub?: string };
      if (session.user) {
        session.user.id = t.id ?? t.sub ?? '';
        session.user.role = (t.role ?? 'user');
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
