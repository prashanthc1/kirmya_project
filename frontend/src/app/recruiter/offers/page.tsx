'use client';

import React from 'react';
import { Typography, Stack, Alert } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ATSLayout from '../../../components/ats/ATSLayout';

export default function RecruiterOffersPage() {
  /*
   * Offers cannot be listed, and cannot be created from here.
   *
   * The API serves `POST /recruiter/offers` and `PUT /recruiter/offers/:id` -
   * an offer can be made and its status changed - but there is no endpoint that
   * returns a recruiter's offers. This page filled that absence with two
   * literals: an offer of $95,000 to "Sarah Chen" and one of $110,000 to
   * "Tariq Al-Mansoor", neither of whom exists, shown to every recruiter.
   *
   * The "Create New Offer" button went the same way. It opened the offer form
   * with four hardcoded identifiers compiled into this file -
   * `a1111111-…`, `11111111-…`, `c1111111-…`, "Sarah Chen" - so submitting it
   * posted a real salary offer against placeholder ids for a candidate nobody
   * had selected. An offer belongs to an application, and it is made from that
   * application, where the real ids are.
   */
  return (
    <ATSLayout>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LocalOfferIcon sx={{ color: '#10b981', fontSize: 28 }} />
        <Typography variant="h5" component="h1" sx={{ fontWeight: 900 }}>
          Job Offer &amp; Contract Workflow Management
        </Typography>
      </Stack>

      <Alert severity="info">
        Offers are not listed here. The platform can issue an offer and change its status, but it
        has no endpoint that returns the offers a recruiter has made, so there is nothing this page
        can show. To make an offer, open the candidate&apos;s application from your pipeline and use
        Issue Offer there.
      </Alert>
    </ATSLayout>
  );
}
