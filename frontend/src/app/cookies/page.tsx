import { redirect } from 'next/navigation';

/** See /terms: the duplicate of /legal/cookies, kept as the address people type. */
export default function CookiesPolicyPage() {
  redirect('/legal/cookies');
}
