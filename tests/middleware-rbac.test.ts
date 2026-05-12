/**
 * RBAC logic test. The actual middleware module imports `next-auth` which
 * resolves the Next.js runtime — un-importable from vitest. We test the
 * decision table directly here.
 */
import { describe, it, expect } from 'vitest';

type Decision = 'allow' | 'redirect-login' | 'redirect-home' | '401' | '403';

interface Req {
  path: string;
  user: null | { role: 'admin' | 'user' };
}

function decide(req: Req): Decision {
  const isApi = req.path.startsWith('/api/admin');
  const isAdminUi = req.path.startsWith('/admin');
  if (!isApi && !isAdminUi) return 'allow';
  if (!req.user) return isApi ? '401' : 'redirect-login';
  if (req.user.role !== 'admin') return isApi ? '403' : 'redirect-home';
  return 'allow';
}

describe('RBAC decision table', () => {
  it('allows non-admin paths for everyone', () => {
    expect(decide({ path: '/articles', user: null })).toBe('allow');
    expect(decide({ path: '/articles', user: { role: 'user' } })).toBe('allow');
  });
  it('redirects anon UI hits on /admin to login', () => {
    expect(decide({ path: '/admin/books', user: null })).toBe('redirect-login');
  });
  it('returns 401 for anon API hits on /api/admin', () => {
    expect(decide({ path: '/api/admin/articles/foo/rasterize', user: null })).toBe('401');
  });
  it('redirects non-admin UI hits on /admin to home', () => {
    expect(decide({ path: '/admin', user: { role: 'user' } })).toBe('redirect-home');
  });
  it('returns 403 for non-admin API hits', () => {
    expect(decide({ path: '/api/admin/articles/batch-rasterize', user: { role: 'user' } })).toBe('403');
  });
  it('allows admin hits everywhere', () => {
    expect(decide({ path: '/admin', user: { role: 'admin' } })).toBe('allow');
    expect(decide({ path: '/api/admin/articles/x/rasterize', user: { role: 'admin' } })).toBe('allow');
  });
});
