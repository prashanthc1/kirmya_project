'use client';

import React from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CommunityCreateModal } from '../../../components/community/CommunityCreateModal';

export default function CreateCommunityPage() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ py: 6 }} data-testid="create-community-page">
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          href="/communities"
          startIcon={<ArrowBackIcon />}
          sx={{ fontWeight: 700 }}
        >
          Back to Communities Discovery
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '24px',
          background: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(16px)',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(99, 102, 241, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Launch a New Professional Community
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
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
  );
}
