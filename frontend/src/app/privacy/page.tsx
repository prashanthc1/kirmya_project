import { redirect } from 'next/navigation';

/** See /terms: the duplicate of /legal/privacy, kept as the address people type. */
export default function PrivacyPage() {
  redirect('/legal/privacy');
}
