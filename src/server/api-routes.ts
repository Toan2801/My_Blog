import { createApiDispatcher } from './api-dispatcher';

export const dispatchApi = createApiDispatcher([
  { path: 'auth/signup', load: () => import('@/server/api-handlers/auth/signup/route') },
  { path: 'admin/articles/batch-rasterize', load: () => import('@/server/api-handlers/admin/articles/batch-rasterize/route') },
  { path: 'admin/videos', load: () => import('@/server/api-handlers/admin/videos/route') },
  { path: 'articles', load: () => import('@/server/api-handlers/articles/route') },
  { path: 'articles/random', load: () => import('@/server/api-handlers/articles/random/route') },
  { path: 'articles/tts', load: () => import('@/server/api-handlers/articles/tts/route') },
  { path: 'articles/tts/proxy', load: () => import('@/server/api-handlers/articles/tts/proxy/route') },
  { path: 'comments', load: () => import('@/server/api-handlers/comments/route') },
  { path: 'config', load: () => import('@/server/api-handlers/config/route') },
  { path: 'series', load: () => import('@/server/api-handlers/series/route') },
  { path: 'upload', load: () => import('@/server/api-handlers/upload/route') },
  { path: 'upload-qr', load: () => import('@/server/api-handlers/upload-qr/route') },
  { path: 'admin/articles/[slug]/generate-audio', load: () => import('@/server/api-handlers/admin/articles/[slug]/generate-audio/route') },
  { path: 'admin/articles/[slug]/rasterize', load: () => import('@/server/api-handlers/admin/articles/[slug]/rasterize/route') },
  { path: 'articles/[slug]/page/[n]/image', load: () => import('@/server/api-handlers/articles/[slug]/page/[n]/image/route') },
  { path: 'articles/[slug]/page/[n]/markdown', load: () => import('@/server/api-handlers/articles/[slug]/page/[n]/markdown/route') },
  { path: 'articles/[slug]/pages', load: () => import('@/server/api-handlers/articles/[slug]/pages/route') },
  { path: 'articles/[slug]/preview', load: () => import('@/server/api-handlers/articles/[slug]/preview/route') },
  { path: 'articles/[slug]/search', load: () => import('@/server/api-handlers/articles/[slug]/search/route') },
  { path: 'auth/[...nextauth]', load: () => import('@/server/api-handlers/auth/[...nextauth]/route') },
]);
