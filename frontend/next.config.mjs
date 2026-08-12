import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Without this, Next walks up to the repo-root package-lock.json, decides the
  // workspace root is one level up, and emits .next/standalone/frontend/server.js
  // instead of .next/standalone/server.js. The Dockerfile copies the standalone
  // tree to /app and runs `node server.js`, so the nested layout crashes the
  // container on boot. Pinning the root keeps the output path the same whether
  // the build context is this directory or the whole repository.
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
