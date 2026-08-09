'use client';

/**
 * The public people tab.
 *
 * It lists only the members who chose to make their association visible. Nobody
 * appears here because they work somewhere; they appear because they said the
 * link may be shown. Contact details are never part of this view.
 */
import React from 'react';
import { useParams, useRouter } from 'next/navigation';

import CompanyProfile from '../../../../components/company/CompanyProfile';
import CompanyPeople from '../../../../components/company/CompanyPeople';
import useAuth from '../../../../hooks/useAuth';

export default function CompanyPeoplePage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) ?? '';
  const { isAuthenticated } = useAuth();

  const requireSignIn = React.useCallback(() => {
    router.push(`/signin?redirect=${encodeURIComponent(`/company/${slug}/people`)}`);
  }, [router, slug]);

  return (
    <CompanyProfile slug={slug} activeTab="people">
      {(company) => (
        <CompanyPeople
          identifier={slug}
          companyId={company.id}
          companyName={company.name}
          isAuthenticated={isAuthenticated}
          isMember={company.viewer?.isMember}
          onRequireSignIn={requireSignIn}
          pageSize={12}
        />
      )}
    </CompanyProfile>
  );
}
