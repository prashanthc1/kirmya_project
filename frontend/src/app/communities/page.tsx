'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Paper,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import { communityApi } from '../../features/community/services/communityApi';
import { Community } from '../../features/community/types';
import { CommunityCard } from '../../components/community/CommunityCard';
import { CommunityCreateModal } from '../../components/community/CommunityCreateModal';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  'All',
  'Engineering & Cloud',
  'Artificial Intelligence',
  'Finance & Banking',
  'Product & Design',
  'Healthcare & BioTech',
  'Executive Leadership',
];

function CommunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category') || 'All';
  const initialQuery = searchParams.get('q') || '';

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communityApi.listCommunities({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        query: searchQuery.trim() || undefined,
      });
      setCommunities(data || []);
    } catch {
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCommunities();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchCommunities]);

  const handleJoinToggle = (id: string, isMember: boolean) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              isMember,
              memberCount: isMember ? (c.memberCount || 0) + 1 : Math.max(0, (c.memberCount || 0) - 1),
            }
          : c
      )
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} data-testid="communities-discovery-page">
      {/* Hero Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <GroupsIcon color="primary" sx={{ fontSize: 22 }} />
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Professional Circles & Groups
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.025em', mb: 1, fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' } }}>
              Professional Communities
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mb: 3 }}>
              Join curated technical circles, engage in architectural discussions, exchange industry insights, and build peer networks.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search by community name, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')} aria-label="Clear search">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: {
                    borderRadius: `${tokens.radius.md}px`,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  },
                }}
                sx={{ maxWidth: { xs: '100%', sm: 380 } }}
              />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  borderRadius: `${tokens.radius.sm}px`,
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Create Community
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Category Filter Chips */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          mb: 3,
          overflowX: 'auto',
          pb: 1,
          '::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            clickable
            variant={selectedCategory === cat ? 'filled' : 'outlined'}
            color={selectedCategory === cat ? 'primary' : 'default'}
            onClick={() => setSelectedCategory(cat)}
            sx={{
              fontWeight: 700,
              borderRadius: `${tokens.radius.pill}px`,
              fontSize: '0.8rem',
            }}
          />
        ))}
      </Stack>

      {/* Communities Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} lg={4} key={i}>
              <Skeleton
                variant="rounded"
                height={260}
                sx={{ borderRadius: `${tokens.radius.lg}px` }}
              />
            </Grid>
          ))}
        </Grid>
      ) : communities.length > 0 ? (
        <Grid container spacing={3}>
          {communities.map((comm) => (
            <Grid item xs={12} sm={6} lg={4} key={comm.id}>
              <CommunityCard community={comm} onJoinToggle={handleJoinToggle} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: 'center',
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <GroupsIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No Communities Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mt: 0.5, mb: 3 }}>
            {searchQuery
              ? `No professional groups matched "${searchQuery}". Try broadening your search or choosing a different category.`
              : 'Be the first to launch a technical community for your domain.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
          >
            Create New Community
          </Button>
        </Paper>
      )}

      {/* Community Creation Modal */}
      <CommunityCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(newComm) => {
          setCreateModalOpen(false);
          router.push(`/communities/${newComm.id}`);
        }}
      />
    </Container>
  );
}

export default function CommunitiesDiscoveryPage() {
  return (
    <AuthenticatedLayout>
      <Suspense fallback={null}>
        <CommunitiesContent />
      </Suspense>
    </AuthenticatedLayout>
  );
}
