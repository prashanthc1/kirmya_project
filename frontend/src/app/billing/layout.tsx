import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default function BillingLayout({ children }: { children: ReactNode }) {
  if (process.env.BILLING_ENABLED !== 'true') {
    return (
      <section aria-labelledby="billing-unavailable" style={{ padding: '2rem' }}>
        <h1 id="billing-unavailable">Billing is not offered.</h1>
        <p>Subscriptions, checkout, and payments are unavailable.</p>
      </section>
    );
  }

  return children;
}
