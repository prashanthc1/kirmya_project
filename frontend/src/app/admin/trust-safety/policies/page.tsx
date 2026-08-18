'use client';

import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import SafetyPolicyStudio from '@/components/trust_safety/SafetyPolicyStudio';

export default function AdminPoliciesPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Link href="/admin/trust-safety" passHref style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBackIcon />} sx={{ fontWeight: 800 }}>
            Back to Trust Dashboard
          </Button>
        </Link>
      </Stack>

      <SafetyPolicyStudio />
    </Box>
  );
}
