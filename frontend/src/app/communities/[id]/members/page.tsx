'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community, CommunityMember } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';
import { CommunityMemberDirectory } from '../../../../components/community/CommunityMemberDirectory';

export default function CommunityMembersPage() {
  const params = useParams();
  const communityId = (params?.id as string) || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comm, mList] = await Promise.all([
        communityApi.getCommunity(communityId),
        communityApi.getMembers(communityId),
      ]);
      setCommunity(comm);
      setMembers(mList);
    } catch (err) {
      console.error('Failed to load community members:', err);
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
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="community-members-page">
      <CommunityHeader community={community} />
      <CommunityMemberDirectory
        communityId={community.id}
        members={members}
        userRole={community.role}
        onMemberUpdated={loadData}
      />
    </Container>
  );
}
