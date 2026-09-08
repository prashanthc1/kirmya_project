import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import JobDetailShell from './JobDetailShell';
import { JobDetail } from '../../../features/jobs/types';
import {
  fetchPublicJob,
  jobPostingJsonLd,
  metaDescription,
  siteOrigin,
} from '../../../shared/public_api';

/**
 * A job posting, rendered on the server.
 *
 * F10. This page was a client component, so the HTML a crawler received was an
 * empty shell and the posting only existed after JavaScript ran. No individual
 * job could be indexed, none was eligible for Google for Jobs, and the site's
 * only structured data was a WebSite node on the homepage. For a job board that
 * removes the channel that supplies most of its traffic.
 *
 * The posting is now in the HTML, with a per-job title, description, canonical
 * and JobPosting JSON-LD. The interactive parts — the saved-job bookmark, which
 * needs the visitor's session — stay in the client shell, so a public page can
 * still be cached without leaking anyone's state into it.
 */

/**
 * The status has to be computed per request.
 *
 * With the route cached, a posting that had gone missing rendered its
 * not-found body but served it with HTTP 200 — a soft 404, which is exactly
 * what teaches a crawler that every dead posting is still a live page. The
 * upstream fetch keeps its own five-minute cache, so this costs a render rather
 * than an API call.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchPublicJob(id);

  if (!job) {
    // noindex, because the status cannot currently be trusted.
    //
    // notFound() below renders the right body but does not set a 404 on this
    // Next version: a minimal probe route with a dynamic segment returns 200
    // from a bare notFound() too, while a static route returns 404 correctly.
    // That makes every gone posting a soft 404 — a page that says "this job is
    // gone" while telling the crawler it is fine.
    //
    // Until the status can be fixed, this at least keeps the dead page out of
    // the index. The status defect is recorded as an open gate rather than
    // papered over: noindex stops the page ranking, it does not stop a crawler
    // spending budget rediscovering it.
    return {
      title: 'This job is no longer open',
      robots: { index: false, follow: true },
    };
  }

  const canonical = `${siteOrigin()}/jobs/${job.id}`;
  const where = job.location ? ` in ${job.location}` : '';
  const at = job.company_name ? ` at ${job.company_name}` : '';
  const title = `${job.title}${at}${where}`;

  return {
    title,
    description: metaDescription(
      job.description,
      `Apply for ${job.title}${at}${where} on Kirmya.`
    ),
    alternates: { canonical },
    openGraph: {
      title,
      description: metaDescription(job.description, `Apply for ${job.title} on Kirmya.`),
      url: canonical,
      type: 'article',
      ...(job.company_logo ? { images: [job.company_logo] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription(job.description, `Apply for ${job.title} on Kirmya.`),
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await fetchPublicJob(id);

  // Missing, closed and expired all 404. A page that answers 200 with "this
  // job is gone" teaches a crawler that every dead posting is still a live
  // page, which is what gets a whole board demoted.
  if (!job) {
    notFound();
  }

  const canonical = `${siteOrigin()}/jobs/${job.id}`;

  return (
    <>
      <script
        type="application/ld+json"
        // The payload is built from the posting's own fields and emits only
        // what the posting actually carries; an invented salary or validThrough
        // is worse than an absent one.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job, canonical)) }}
      />
      <JobDetailShell jobId={job.id} job={job as unknown as JobDetail} />
    </>
  );
}
