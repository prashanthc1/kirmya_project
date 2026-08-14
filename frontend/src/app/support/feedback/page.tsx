'use client';

import React from 'react';
import { Box } from '@mui/material';
import FeedbackForm from '@/components/support/FeedbackForm';

export default function SupportFeedbackPage() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <FeedbackForm />
    </Box>
  );
}
