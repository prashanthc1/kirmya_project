'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import { Container, Box, Alert, Skeleton } from '@mui/material';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community, CommunityMember } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';
import { CommunityMemberDirectory } from '../../../../components/community/CommunityMemberDirectory';
import { tokens } from '../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function CommunityMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const communityId = resolvedParams?.id || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [comm, mList] = await Promise.all([
        communityApi.getCommunity(communityId),
        communityApi.getMembers(communityId).catch(() => []),
      ]);
      setCommunity(comm);
      setMembers(mList || []);
    } catch (err) {
      console.error('Failed to load community members:', err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AuthenticatedLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} data-testid="community-members-page">
        {loading ? (
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: `${tokens.radius.lg}px`, mb: 3 }} />
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Box>
        ) : !community ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Community not found.
          </Alert>
        ) : (
          <>
            <CommunityHeader community={community} />
            <CommunityMemberDirectory
              communityId={community.id}
              members={members}
              userRole={community.role}
              onMemberUpdated={loadData}
            />
          </>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
