// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createApiDispatcher } from '@/server/api-dispatcher';

describe('consolidated API routing', () => {
  it('keeps signup ahead of auth catch-all and passes nested callback parameters', async () => {
    const dispatch = createApiDispatcher([
      { path: 'auth/signup', load: async () => ({ POST: () => new Response('signup') }) },
      { path: 'auth/[...nextauth]', load: async () => ({ POST: async (_req: unknown, ctx: { params: Promise<unknown> }) => Response.json(await ctx.params) }) },
    ]);
    const req = new NextRequest('https://example.com/api/auth/signup', { method: 'POST' });
    expect(await (await dispatch(req, { params: Promise.resolve({ path: ['auth', 'signup'] }) })).text()).toBe('signup');
    const callback = await dispatch(req, { params: Promise.resolve({ path: ['auth', 'callback', 'credentials'] }) });
    expect(await callback.json()).toEqual({ nextauth: ['callback', 'credentials'] });
    expect((await dispatch(req, { params: Promise.resolve({ path: ['auth'] }) })).status).toBe(404);
  });
  it('preserves request bodies, cookies, queries and dynamic parameters', async () => {
    const handler = vi.fn(async (req, ctx) => Response.json({
      params: await ctx.params, body: await req.json(),
      cookie: req.headers.get('cookie'), query: req.nextUrl.searchParams.get('q'),
    }));
    const dispatch = createApiDispatcher([{ path: 'articles/[slug]/page/[n]/image', load: async () => ({ POST: handler }) }]);
    const request = new NextRequest('https://example.com/api/articles/demo/page/2/image?q=value', {
      method: 'POST', headers: { cookie: 'session=abc', 'content-type': 'application/json' }, body: '{"test":true}',
    });
    const response = await dispatch(request, { params: Promise.resolve({ path: ['articles', 'demo', 'page', '2', 'image'] }) });
    expect(await response.json()).toEqual({ params: { slug: 'demo', n: '2' }, body: { test: true }, cookie: 'session=abc', query: 'value' });
    expect(handler.mock.calls[0][0]).toBe(request);
  });

  it('handles unknown paths, allowed methods, HEAD and OPTIONS', async () => {
    const dispatch = createApiDispatcher([{ path: 'config', load: async () => ({ GET: () => new Response('body', { headers: { 'x-test': 'ok' } }) }) }]);
    const call = (method: string, path = ['config']) => dispatch(new NextRequest('https://example.com/api/config', { method }), { params: Promise.resolve({ path }) });
    expect((await call('GET', ['missing'])).status).toBe(404);
    expect((await call('POST')).status).toBe(405);
    const options = await call('OPTIONS');
    expect(options.status).toBe(204);
    expect(options.headers.get('allow')).toBe('GET, HEAD, OPTIONS');
    const head = await call('HEAD');
    expect(await head.text()).toBe('');
    expect(head.headers.get('x-test')).toBe('ok');
  });

  it('returns authorization failures unchanged', async () => {
    const dispatch = createApiDispatcher([{ path: 'admin/videos', load: async () => ({ POST: () => Response.json({ error: 'Forbidden' }, { status: 403 }) }) }]);
    const response = await dispatch(new NextRequest('https://example.com/api/admin/videos', { method: 'POST' }), { params: Promise.resolve({ path: ['admin', 'videos'] }) });
    expect(response.status).toBe(403);
  });
});
