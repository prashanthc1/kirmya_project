'use client';

import React from 'react';
import { Container, Card, Typography, Stack, Button, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function HelpArticleDetailPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button component={Link} href="/help" startIcon={<ArrowBackIcon />} sx={{ mb: 2, fontWeight: 800 }}>
        Back to Help Center
      </Button>
      <Card sx={{ borderRadius: '24px', p: { xs: 3, md: 5 } }}>
        <Chip label="Getting Started" color="primary" size="small" sx={{ mb: 2, fontWeight: 700 }} />
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
          How to Create and Optimize Your Kirmya Candidate Profile
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Building an optimized profile on Kirmya is essential for attracting verified recruiters. Start by setting your employment status, adding key technical skills, uploading your formatted resume, and verifying your professional email address.
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 4 }}>
          1. Verify your candidate email address to unlock verified job applications.<br />
          2. Add your primary technical stack and career focus.<br />
          3. Upload your current resume for automated ATS parsing.<br />
          4. Enable job alert preferences for instant notifications on new openings.
        </Typography>
        <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'action.hover', textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Was this article helpful?</Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" color="success" size="small">Yes</Button>
            <Button variant="outlined" color="error" size="small">No</Button>
          </Stack>
        </Card>
      </Card>
    </Container>
  );
}
