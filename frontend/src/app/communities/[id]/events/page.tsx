'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community, CommunityEvent } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';
import { CommunityEventsCard } from '../../../../components/community/CommunityEventsCard';

export default function CommunityEventsPage() {
  const params = useParams();
  const communityId = (params?.id as string) || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comm, eList] = await Promise.all([
        communityApi.getCommunity(communityId),
        communityApi.getEvents(communityId),
      ]);
      setCommunity(comm);
      setEvents(eList);
    } catch (err) {
      console.error('Failed to load community events data:', err);
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
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="community-events-page">
      <CommunityHeader community={community} />
      <CommunityEventsCard
        communityId={community.id}
        events={events}
        userRole={community.role}
        onEventUpdated={loadData}
      />
    </Container>
  );
}
