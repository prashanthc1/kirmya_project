'use client';

import React, { useState } from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import ModerationQueueTable from '@/components/trust_safety/ModerationQueueTable';
import CaseInvestigationDrawer from '@/components/trust_safety/CaseInvestigationDrawer';
import { SafetyCase } from '@/features/trust_safety/types';

export default function AdminQueuePage() {
  const [selectedCase, setSelectedCase] = useState<SafetyCase | null>(null);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Link href="/admin/trust-safety" passHref style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBackIcon />} sx={{ fontWeight: 800 }}>
            Back to Trust Dashboard
          </Button>
        </Link>
      </Stack>

      {/* Queue Table */}
      <ModerationQueueTable onSelectCase={(c) => setSelectedCase(c)} />

      {/* Investigation Drawer */}
      <CaseInvestigationDrawer
        open={Boolean(selectedCase)}
        onClose={() => setSelectedCase(null)}
        caseItem={selectedCase}
        onActionExecuted={() => {
          setSelectedCase(null);
        }}
      />
    </Box>
  );
}
