import type { NextRequest } from 'next/server';

type Handler = (request: NextRequest, context: { params: Promise<Record<string, string | string[]>> }) => Response | Promise<Response>;
type ApiRoute = { path: string; load: () => Promise<unknown> };
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/** Dispatch the original request unchanged, including cookies, query and body. */
export function createApiDispatcher(routes: ApiRoute[]) {
  return async (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => {
    const { path } = await context.params;
    for (const route of routes) {
      const segments = route.path.split('/');
      const catchAll = segments[segments.length - 1].startsWith('[...');
      if (catchAll ? path.length < segments.length : segments.length !== path.length) continue;
      const params: Record<string, string | string[]> = {};
      const matches = segments.every((segment, index) => {
        if (segment.startsWith('[...')) {
          params[segment.slice(4, -1)] = path.slice(index);
          return true;
        }
        if (segment.startsWith('[')) {
          params[segment.slice(1, -1)] = path[index];
          return true;
        }
        return segment === path[index];
      });
      if (!matches) continue;
      const handlers = await route.load() as Record<string, Handler | undefined>;
      const allowed = methods.filter(method => typeof handlers[method] === 'function');
      if (handlers.GET && !handlers.HEAD) allowed.push('HEAD');
      if (!handlers.OPTIONS) allowed.push('OPTIONS');
      const allow = allowed.sort().join(', ');
      if (request.method === 'OPTIONS' && !handlers.OPTIONS) {
        return new Response(null, { status: 204, headers: { Allow: allow } });
      }
      const handler = handlers[request.method] ?? (request.method === 'HEAD' ? handlers.GET : undefined);
      if (!handler) return new Response(null, { status: 405, headers: { Allow: allow } });
      const response = await handler(request, { params: Promise.resolve(params) });
      return request.method === 'HEAD'
        ? new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers })
        : response;
    }
    return Response.json({ error: 'Not found' }, { status: 404 });
  };
}
