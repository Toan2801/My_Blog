import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';

/**
 * RBAC middleware: gates `/admin/*` and `/api/admin/*` to users whose JWT has
 * `role === 'admin'`. Other authenticated users get 403; anonymous users are
 * redirected to /login (UI) or get 401 (API).
 *
 * Uses the edge-safe auth.config slice — pulling in src/auth.ts here would
 * crash the Edge runtime because of mongoose/bcryptjs/mongodb imports.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isApi = nextUrl.pathname.startsWith('/api/admin');
  const isAdminUi = nextUrl.pathname.startsWith('/admin');
  if (!isApi && !isAdminUi) return NextResponse.next();

  const user = req.auth?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL('/login', nextUrl);
    url.searchParams.set('callbackUrl', nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (user.role !== 'admin') {
    if (isApi) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.redirect(new URL('/', nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
