'use client';

/**
 * The public jobs tab.
 *
 * These are the same job rows the rest of Kirmya serves, filtered to this
 * company and to what a visitor may see — the module does not keep its own copy
 * of the jobs board.
 */
import React from 'react';
import { useParams } from 'next/navigation';

import CompanyProfile from '../../../../components/company/CompanyProfile';
import CompanyJobs from '../../../../components/company/CompanyJobs';

export default function CompanyJobsPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? '';

  return (
    <CompanyProfile slug={slug} activeTab="jobs">
      {(company) => (
        <CompanyJobs
          identifier={slug}
          pageSize={10}
          emptyMessage={`${company.name} has no open roles on Kirmya right now.`}
        />
      )}
    </CompanyProfile>
  );
}
