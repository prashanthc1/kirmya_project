'use client';

import React from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { CommunityCreateModal } from '../../../components/community/CommunityCreateModal';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function CreateCommunityPage() {
  const router = useRouter();

  return (
    <AuthenticatedLayout>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }} data-testid="create-community-page">
        <Box sx={{ mb: 3 }}>
          <Button
            component={Link}
            href="/communities"
            startIcon={<ArrowBackIcon />}
            sx={{ fontWeight: 700, borderRadius: `${tokens.radius.sm}px`, textTransform: 'none' }}
          >
            Back to Communities Discovery
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            Launch a Professional Community
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Build an exclusive network for your engineering, leadership, or industry specialization with custom governance rules and privacy controls.
          </Typography>

          <CommunityCreateModal
            open={true}
            onClose={() => router.push('/communities')}
            onCreated={(newComm) => {
              router.push(`/communities/${newComm.id}`);
            }}
          />
        </Paper>
      </Container>
    </AuthenticatedLayout>
  );
}
