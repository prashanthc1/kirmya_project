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
  /**
   * Route consolidation.
   *
   * Normal users no longer have a generic dashboard: /feed is the signed-in
   * home. The dashboard index is gone, and the sub-pages that duplicated a
   * canonical route redirect to it rather than leaving two URLs for one screen.
   * Permanent, because these are product decisions rather than temporary
   * moves, and server-side, so an old bookmark or an emailed link lands in the
   * right place without the client rendering the wrong page first.
   *
   * Each source is a page that existed; none of these targets redirects back,
   * so no pair can loop.
   */
  async redirects() {
    return [
      { source: '/dashboard', destination: '/feed', permanent: true },
      { source: '/dashboard/applications', destination: '/applications', permanent: true },
      { source: '/dashboard/applications/:id', destination: '/applications/:id', permanent: true },
      { source: '/dashboard/saved-jobs', destination: '/saved-jobs', permanent: true },
      { source: '/dashboard/jobs', destination: '/jobs', permanent: true },
      { source: '/dashboard/job-alerts', destination: '/job-alerts', permanent: true },
      { source: '/dashboard/job-recommendations', destination: '/jobs/recommendations', permanent: true },
      { source: '/dashboard/recommended-jobs', destination: '/jobs/recommendations', permanent: true },
      // The company console was one page for whichever company a ?company=
      // parameter named. Management is entity-scoped now, and the index cannot
      // know which company to open, so it goes to the company directory where
      // the viewer picks one.
      { source: '/company/dashboard', destination: '/companies', permanent: true },
      // Two unlinked wrappers around the same BillingDashboard the top-level
      // /billing already renders. Removed rather than moved; the addresses
      // still resolve.
      { source: '/company/dashboard/billing', destination: '/billing', permanent: true },
      { source: '/company/dashboard/plan', destination: '/billing/plans', permanent: true },
      // Deliberately no blanket /company/:slug rule: /company/create,
      // /company/analytics and /company/invitations/accept are real pages that
      // such a rule would swallow. The duplicate public company profile at
      // /company/[slug] is left in place for now and recorded as remaining work
      // rather than redirected into a 404.

      // Duplicate module prefixes. The backend retired the matching API
      // aliases in batch 5; these are the web halves of the same pair.
      { source: '/messaging', destination: '/messages', permanent: true },
      { source: '/messaging/:path*', destination: '/messages/:path*', permanent: true },
      { source: '/networking', destination: '/network', permanent: true },
      { source: '/networking/:path*', destination: '/network/:path*', permanent: true },
    ];
  },
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
