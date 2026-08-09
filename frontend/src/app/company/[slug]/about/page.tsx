'use client';

/** The full "About" tab. Everything on it is the company's own stored copy. */
import React from 'react';
import { useParams } from 'next/navigation';

import CompanyProfile from '../../../../components/company/CompanyProfile';
import CompanyAbout from '../../../../components/company/CompanyAbout';

export default function CompanyAboutPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? '';

  return (
    <CompanyProfile slug={slug} activeTab="about">
      {(company) => <CompanyAbout company={company} />}
    </CompanyProfile>
  );
}
