import { redirect } from 'next/navigation';

/**
 * Kept as a redirect, not a page.
 *
 * This rendered the same LegalDocumentViewer with the same slug as
 * /legal/terms, so the identical document was served under two URLs and a
 * crawler had to pick one. /legal is the canonical tree: it carries all
 * fourteen documents the legal module publishes, not just these three.
 *
 * The route stays because /terms is the address people type and the one any
 * existing link points at.
 */
export default function TermsPage() {
  redirect('/legal/terms');
}
