import { MetadataRoute } from 'next';
import { fetchOpenJobsForSitemap, siteOrigin } from '../shared/public_api';

/**
 * The sitemap, built from real inventory.
 *
 * F10. This was six hardcoded URLs — the homepage, /jobs, /companies,
 * /communities, /signin and /signup — and listed not one job posting. A crawler
 * reading it was told the board's entire indexable surface was six pages, which
 * is why individual postings were never fetched even once they could be
 * rendered.
 *
 * Job pages carry a real `lastModified` so a crawler can tell a reposted job
 * from an untouched one, and only open postings appear: listing an expired job
 * points a crawler at a page that 404s, which is worse than omitting it.
 */
/*
 * Rendered per request, not baked at build time.
 *
 * With `revalidate` alone Next prerenders this route during the build, so the
 * sitemap froze whatever the API returned at that moment. In CI the frontend is
 * built before the API starts, so it was built against nothing and shipped a
 * sitemap listing zero postings — which is what the public-indexing spec
 * caught.
 *
 * The deployment case is worse than the CI one and would not have been caught
 * at all. A container image bakes its sitemap when it is built; every posting
 * created after that is invisible to a crawler until something revalidates the
 * route. For a board whose inventory turns over continuously, a build-time
 * sitemap defeats the whole point of publishing one.
 *
 * The cost of rendering per request is bounded: fetchOpenJobsForSitemap's own
 * fetches carry `next: { revalidate: 300 }`, so the board is read at most once
 * every five minutes however often this route is hit.
 */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteOrigin();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/jobs`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/companies`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/communities`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // /signin is deliberately absent. It is not content, it has nothing to
    // rank for, and every crawl of it is budget spent on a page that will never
    // bring anyone here.
  ];

  const jobs = await fetchOpenJobsForSitemap();

  const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: new Date(job.published_at || job.created_at || now),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...jobRoutes];
}
