'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community, CommunityModerationAction, CommunityJoinRequest } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';
import { CommunityModerationDesk } from '../../../../components/community/CommunityModerationDesk';

export default function CommunityModerationPage() {
  const params = useParams();
  const communityId = (params?.id as string) || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [actions, setActions] = useState<CommunityModerationAction[]>([]);
  const [joinRequests, setJoinRequests] = useState<CommunityJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comm, actList, reqList] = await Promise.all([
        communityApi.getCommunity(communityId),
        communityApi.getModerationActions(communityId),
        communityApi.getJoinRequests(communityId),
      ]);
      setCommunity(comm);
      setActions(actList);
      setJoinRequests(reqList);
    } catch (err) {
      console.error('Failed to load community moderation data:', err);
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
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="community-moderation-page">
      <CommunityHeader community={community} />
      <CommunityModerationDesk
        communityId={community.id}
        actions={actions}
        joinRequests={joinRequests}
        onActionResolved={loadData}
      />
    </Container>
  );
}
