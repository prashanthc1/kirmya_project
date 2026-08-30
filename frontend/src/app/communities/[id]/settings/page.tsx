'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Box, Alert, Skeleton } from '@mui/material';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';
import { CommunitySettingsTab } from '../../../../components/community/CommunitySettingsTab';
import { tokens } from '../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function CommunitySettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const communityId = resolvedParams?.id || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const comm = await communityApi.getCommunity(communityId);
      setCommunity(comm);
    } catch (err) {
      console.error('Failed to load community settings:', err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AuthenticatedLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} data-testid="community-settings-page">
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
            <CommunitySettingsTab
              community={community}
              onSave={(updated) => setCommunity({ ...community, ...updated })}
              onDelete={() => router.push('/communities')}
            />
          </>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
