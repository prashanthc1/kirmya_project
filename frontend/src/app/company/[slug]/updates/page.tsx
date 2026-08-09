'use client';

/**
 * The updates tab.
 *
 * Visitors see published posts. A member holding the update permissions sees
 * the drafts and scheduled posts as well, and gets the composer — the same
 * component decides that from the viewer context the API returned.
 */
import React from 'react';
import { useParams } from 'next/navigation';

import CompanyProfile from '../../../../components/company/CompanyProfile';
import CompanyUpdates from '../../../../components/company/CompanyUpdates';

export default function CompanyUpdatesPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? '';

  return (
    <CompanyProfile slug={slug} activeTab="updates">
      {(company) => (
        <CompanyUpdates
          identifier={slug}
          companyId={company.id}
          companyName={company.name}
          companyLogoUrl={company.logoUrl}
          viewer={company.viewer}
          pageSize={10}
        />
      )}
    </CompanyProfile>
  );
}
