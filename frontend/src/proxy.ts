import { NextResponse, type NextRequest } from 'next/server';

/**
 * Hidden product areas answer 404.
 *
 * The areas are listed in src/shared/features.ts. A request inside one is
 * rewritten to a path no page serves, so the application's own not-found page
 * renders with a 404 status: an old bookmark or a search result lands on "page
 * not found", not on a feature that is switched off.
 *
 * The matcher has to be a static literal for Next to read it at build time, so
 * it repeats the prefixes; features.test.ts fails if the two lists drift.
 */
export function proxy(request: NextRequest) {
  return NextResponse.rewrite(new URL('/_hidden', request.url));
}

export const config = {
  matcher: [
    '/career-companion/:path*',
    '/resume-analysis/:path*',
    '/jobs/match/:path*',
    '/ai-job-match/:path*',
    '/recruiter/ai-workspace/:path*',
    '/interview-prep/:path*',
    '/dashboard/interview-prep/:path*',
    '/recommendations/:path*',
    '/analytics/workforce-intelligence/:path*',
    '/network/:path*',
    '/networking/:path*',
    '/people/:path*',
    '/notifications/network/:path*',
    '/messages/:path*',
    '/recruiter/messages/:path*',
    '/notifications/messages/:path*',
  ],
};
