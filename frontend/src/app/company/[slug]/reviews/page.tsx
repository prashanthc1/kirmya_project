'use client';

/**
 * The public reviews tab.
 *
 * Every review here was written by a person. Nothing on this page is generated,
 * summarised into invented prose, or averaged into a claim the ratings do not
 * support — a company with no reviews shows none.
 */
import React from 'react';
import { useParams, useRouter } from 'next/navigation';

import CompanyProfile from '../../../../components/company/CompanyProfile';
import CompanyReviews from '../../../../components/company/CompanyReviews';
import useAuth from '../../../../hooks/useAuth';

export default function CompanyReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) ?? '';
  const { isAuthenticated } = useAuth();

  const requireSignIn = React.useCallback(() => {
    router.push(`/signin?redirect=${encodeURIComponent(`/company/${slug}/reviews`)}`);
  }, [router, slug]);

  return (
    <CompanyProfile slug={slug} activeTab="reviews">
      {(company) => (
        <CompanyReviews
          identifier={slug}
          companyId={company.id}
          companyName={company.name}
          isAuthenticated={isAuthenticated}
          viewer={company.viewer}
          onRequireSignIn={requireSignIn}
          pageSize={10}
        />
      )}
    </CompanyProfile>
  );
}
