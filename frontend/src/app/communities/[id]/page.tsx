'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import { Container, Grid, Box, Alert, Skeleton } from '@mui/material';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { communityApi } from '../../../features/community/services/communityApi';
import { Community, CommunityPost, CommunityEvent, CommunityResource } from '../../../features/community/types';
import { CommunityHeader } from '../../../components/community/CommunityHeader';
import { CommunityFeed } from '../../../components/community/CommunityFeed';
import { CommunityEventsCard } from '../../../components/community/CommunityEventsCard';
import { CommunityResourcesCard } from '../../../components/community/CommunityResourcesCard';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function CommunityHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const communityId = resolvedParams?.id || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHubData = useCallback(async () => {
    try {
      setLoading(true);
      const [comm, pList, eList, rList] = await Promise.all([
        communityApi.getCommunity(communityId),
        communityApi.getPosts(communityId).catch(() => []),
        communityApi.getEvents(communityId).catch(() => []),
        communityApi.getResources(communityId).catch(() => []),
      ]);
      setCommunity(comm);
      setPosts(pList || []);
      setEvents(eList || []);
      setResources(rList || []);
    } catch (err) {
      console.error('Failed to load community hub:', err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadHubData();
  }, [loadHubData]);

  return (
    <AuthenticatedLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} data-testid="community-hub-page">
        {loading ? (
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: `${tokens.radius.lg}px`, mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Skeleton variant="rounded" height={380} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              </Grid>
              <Grid item xs={12} lg={4}>
                <Skeleton variant="rounded" height={280} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              </Grid>
            </Grid>
          </Box>
        ) : !community ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Community not found or access restricted.
          </Alert>
        ) : (
          <>
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
          </>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
