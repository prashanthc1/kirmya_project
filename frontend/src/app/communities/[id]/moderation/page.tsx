'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import { Container, Box, Alert, Skeleton } from '@mui/material';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community, CommunityModerationAction, CommunityJoinRequest } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';
import { CommunityModerationDesk } from '../../../../components/community/CommunityModerationDesk';
import { tokens } from '../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function CommunityModerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const communityId = resolvedParams?.id || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [actions, setActions] = useState<CommunityModerationAction[]>([]);
  const [joinRequests, setJoinRequests] = useState<CommunityJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [comm, actList, reqList] = await Promise.all([
        communityApi.getCommunity(communityId),
        communityApi.getModerationActions(communityId).catch(() => []),
        communityApi.getPendingRequests(communityId).catch(() => []),
      ]);
      setCommunity(comm);
      setActions(actList || []);
      setJoinRequests(reqList || []);
    } catch (err) {
      console.error('Failed to load community moderation data:', err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AuthenticatedLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} data-testid="community-moderation-page">
        {loading ? (
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: `${tokens.radius.lg}px`, mb: 3 }} />
            <Skeleton variant="rounded" height={360} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Box>
        ) : !community ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Community not found.
          </Alert>
        ) : (
          <>
            <CommunityHeader community={community} />
            <CommunityModerationDesk
              communityId={community.id}
              actions={actions}
              joinRequests={joinRequests}
              onActionResolved={loadData}
            />
          </>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
