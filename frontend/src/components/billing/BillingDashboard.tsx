'use client';

import React from 'react';
import { Box, Typography, Grid, Card, Stack, useTheme } from '@mui/material';
import BillingDisabledBanner from './BillingDisabledBanner';
import BillingPlanCard from './BillingPlanCard';
import PaymentIcon from '@mui/icons-material/Payment';

export const BillingDashboard: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <PaymentIcon sx={{ color: '#6366f1', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Billing &amp; Subscription Management
        </Typography>
      </Stack>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Future-ready billing architecture. Kirmya is currently 100% free with no payment requirements.
      </Typography>

      <BillingDisabledBanner />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <BillingPlanCard
            name="Free Candidate &amp; Recruiter"
            price="$0 / mo"
            description="Unlimited access to job applications, networking, resume building, and candidate search."
            features={['Unlimited Job Applications', 'Public Candidate Search', 'Basic AI Resume Analysis', 'Community Access']}
            isCurrent={true}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <BillingPlanCard
            name="Future Recruiter Pro"
            price="$0 / mo"
            description="Future tier concept for high-volume recruitment agencies (Currently Free)."
            features={['AI Candidate Matching', 'Bulk Recruiter Outreach', 'Advanced Talent Pools', 'Priority Support']}
            isCurrent={false}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <BillingPlanCard
            name="Future Enterprise"
            price="$0 / mo"
            description="Future tier concept for enterprise workforce intelligence (Currently Free)."
            features={['Workforce Intelligence Analytics', 'Custom ATS Integration', 'Dedicated Account Manager', 'SLA Support']}
            isCurrent={false}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BillingDashboard;
