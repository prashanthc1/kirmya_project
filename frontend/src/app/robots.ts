import { MetadataRoute } from 'next';
import { siteOrigin } from '../shared/public_api';

/**
 * Crawler rules.
 *
 * The sitemap URL and the disallow list both come from the same origin the
 * canonicals use, so a staging deployment does not advertise the production
 * sitemap — which is how a preview environment ends up indexed alongside the
 * real site and competing with it.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        // Authenticated surfaces. A crawler following these gets a redirect to
        // sign-in, so every fetch is crawl budget spent on nothing.
        '/dashboard/',
        '/settings/',
        '/messages/',
        '/notifications/',
        '/applications/',
        // Search result pages: infinite parameter combinations, no unique
        // content, and they crowd out the postings that should be indexed.
        '/search',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
