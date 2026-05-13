export async function register() {
  // Warm caches at server startup so first requests are fast
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmCaches } = await import('./lib/cache');
    await warmCaches();
  }
}
