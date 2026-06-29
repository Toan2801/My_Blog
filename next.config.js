/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingExcludes: {
    '*': [
      // Dev-only: puppeteer + chromium (~25MB) — only used by rasterize script
      './node_modules/puppeteer/**',
      './node_modules/puppeteer-core/**',
      './node_modules/chromium-bidi/**',
      './node_modules/@puppeteer/**',
      // Dev-only: test runner
      './node_modules/happy-dom/**',
      './node_modules/vitest/**',
      './node_modules/@vitest/**',
      // Dev-only: TypeScript compiler (not needed at runtime)
      './node_modules/typescript/**',
    ],
  },
};

module.exports = nextConfig;

