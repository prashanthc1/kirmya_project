'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';
import { CommunitySettingsTab } from '../../../../components/community/CommunitySettingsTab';

export default function CommunitySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = (params?.id as string) || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const comm = await communityApi.getCommunity(communityId);
      setCommunity(comm);
    } catch (err) {
      console.error('Failed to load community settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [communityId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!community) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Alert severity="error">Community not found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="community-settings-page">
      <CommunityHeader community={community} />
      <CommunitySettingsTab
        community={community}
        onSave={(updated) => setCommunity({ ...community, ...updated })}
        onDelete={() => router.push('/communities')}
      />
    </Container>
  );
}
