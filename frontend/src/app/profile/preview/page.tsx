'use client';

import React, { useState } from 'react';
import { Container, Typography, Card, Stack, Button, Box } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileAbout from '@/components/profile/ProfileAbout';

export default function ProfilePreviewPage() {
  const [viewMode, setViewMode] = useState<'public' | 'members' | 'connections'>('public');

  const previewData: any = {
    id: 'preview-1',
    userId: 'user-1',
    username: 'johndoe',
    headline: 'Senior Distributed Systems Engineer',
    summary: 'This is how your profile appears to viewers under your configured privacy level.',
    location: 'Dubai, UAE',
    availabilityStatus: 'open_to_work',
    openToWork: true,
    profileCompletedPercentage: 85,
    verificationStatus: 'verified',
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <VisibilityIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Profile Privacy & Viewer Preview Mode
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant={viewMode === 'public' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('public')}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Public View
          </Button>
          <Button
            variant={viewMode === 'members' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('members')}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Kirmya Members View
          </Button>
          <Button
            variant={viewMode === 'connections' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('connections')}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Connections View
          </Button>
        </Stack>
      </Stack>

      <ProfileHeader profile={previewData} isOwner={false} />
      <ProfileAbout summary={previewData.summary} />
    </Container>
  );
}
