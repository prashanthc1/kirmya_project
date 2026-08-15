'use client';

import React, { useState } from 'react';
import { Container, Typography, Card, Stack, Button, Box } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfilePublicPreviewModal from '@/components/profile/ProfilePublicPreviewModal';
import { UserProfile } from '@/features/profile/types';

export default function ProfilePreviewPage() {
  const [viewMode, setViewMode] = useState<'public' | 'members' | 'connections'>('public');
  const [modalOpen, setModalOpen] = useState(false);

  const previewData: UserProfile = {
    id: 'preview-1',
    userId: 'user-1',
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: '',
    coverUrl: '',
    headline: 'Senior Distributed Systems Engineer & Cloud Architect',
    summary: 'This is how your candidate profile appears to external viewers under your configured privacy settings.',
    location: 'Dubai, UAE',
    availabilityStatus: 'open_to_work',
    openToWork: true,
    openToRecruiters: true,
    targetRoles: ['Senior Software Engineer'],
    preferredLocations: ['Dubai'],
    profileCompletedPercentage: 85,
    verificationStatus: 'verified',
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <VisibilityIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Profile Privacy & Viewer Preview Mode
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant={viewMode === 'public' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('public')}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Public View
          </Button>
          <Button
            variant={viewMode === 'members' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('members')}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Kirmya Members View
          </Button>
          <Button
            variant={viewMode === 'connections' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('connections')}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Connections View
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setModalOpen(true)}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Open Modal Preview
          </Button>
        </Stack>
      </Stack>

      <ProfileHeader profile={previewData} isOwner={false} />
      <ProfileAbout summary={previewData.summary} />

      <ProfilePublicPreviewModal
        open={modalOpen}
        profile={previewData}
        onClose={() => setModalOpen(false)}
      />
    </Container>
  );
}
