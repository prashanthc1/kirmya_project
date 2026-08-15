'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Grid, CircularProgress, Box, Alert } from '@mui/material';
import { communityApi } from '../../../features/community/services/communityApi';
import { Community, CommunityPost, CommunityEvent, CommunityResource } from '../../../features/community/types';
import { CommunityHeader } from '../../../components/community/CommunityHeader';
import { CommunityFeed } from '../../../components/community/CommunityFeed';
import { CommunityEventsCard } from '../../../components/community/CommunityEventsCard';
import { CommunityResourcesCard } from '../../../components/community/CommunityResourcesCard';

export default function CommunityHubPage() {
  const params = useParams();
  const communityId = (params?.id as string) || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHubData = async () => {
    try {
      setLoading(true);
      const [comm, pList, eList, rList] = await Promise.all([
        communityApi.getCommunity(communityId),
        communityApi.getPosts(communityId),
        communityApi.getEvents(communityId),
        communityApi.getResources(communityId),
      ]);
      setCommunity(comm);
      setPosts(pList);
      setEvents(eList);
      setResources(rList);
    } catch (err) {
      console.error('Failed to load community hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHubData();
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
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="community-hub-page">
      {/* Header Banner & Navigation */}
      <CommunityHeader community={community} />

      {/* Hub Layout */}
      <Grid container spacing={3}>
        {/* Main Feed Column */}
        <Grid item xs={12} lg={8}>
          <CommunityFeed
            communityId={community.id}
            posts={posts}
            userRole={community.role}
            onPostUpdated={loadHubData}
          />
        </Grid>

        {/* Right Widgets Column */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <CommunityEventsCard
              communityId={community.id}
              events={events}
              userRole={community.role}
              onEventUpdated={loadHubData}
            />
            <CommunityResourcesCard
              communityId={community.id}
              resources={resources}
              userRole={community.role}
              onResourceAdded={loadHubData}
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
