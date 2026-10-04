import { redirect } from 'next/navigation';

/**
 * Kept as a redirect, not a page.
 *
 * This served a second public company profile - its own layout, its own fetch,
 * and a "Full Company Page" button pointing at the other one. /company/[slug]
 * is the profile this product serves: it carries the tab row, the jobs, the
 * updates and the reviews, and it is where the directory already sends people
 * (CompanyCard pushes /company/{handle}).
 *
 * The address stays alive because /companies/[handle] is what the management
 * console links back to, and what anything older points at.
 */
export default async function CompanyDetailRedirect({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  redirect(`/company/${encodeURIComponent(handle)}`);
}
