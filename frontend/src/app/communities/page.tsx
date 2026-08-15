'use client';

import React, { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ExploreIcon from '@mui/icons-material/Explore';
import StarIcon from '@mui/icons-material/Star';
import Link from 'next/link';
import { communityApi } from '../../features/community/services/communityApi';
import { Community } from '../../features/community/types';
import { CommunityCard } from '../../components/community/CommunityCard';
import { CommunityCreateModal } from '../../components/community/CommunityCreateModal';

const CATEGORIES = [
  'All',
  'Engineering & Cloud',
  'Artificial Intelligence',
  'Finance & Banking',
  'Product & Design',
  'Healthcare & BioTech',
  'Executive Leadership',
];

export default function CommunitiesDiscoveryPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const data = await communityApi.listCommunities({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        query: searchQuery || undefined,
      });
      setCommunities(data);
    } catch (e) {
      console.error('Failed to load communities:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommunities();
  };

  const handleJoinToggle = (id: string, isMember: boolean) => {
    setCommunities(
      communities.map((c) =>
        c.id === id
          ? {
              ...c,
              isMember,
              memberCount: isMember ? c.memberCount + 1 : Math.max(0, c.memberCount - 1),
            }
          : c
      )
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="communities-discovery-page">
      {/* Hero Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: '24px',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
          backdropFilter: 'blur(16px)',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(99, 102, 241, 0.2)'
              : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Chip
              icon={<GroupsIcon sx={{ fontSize: 18 }} />}
              label="Professional Knowledge & Collaboration Groups"
              color="primary"
              variant="filled"
              sx={{ fontWeight: 700, mb: 1.5, px: 1 }}
            />
            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.025em' }}>
              Connect with Industry Peers & Engineering Leaders
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mb: 3 }}>
              Join curated technology circles, participate in architectural discussions, share technical blueprints, and host virtual events.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1, maxWidth: 500 }}>
                <TextField
                  placeholder="Search groups, topics (e.g. Kubernetes, LLMs)..."
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '14px', bgcolor: 'background.paper' },
                  }}
                />
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  borderRadius: '14px',
                  fontWeight: 700,
                  px: 3,
                  py: 1.25,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35)',
                }}
              >
                Create Community
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '20px',
                background: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} color="primary.main" gutterBottom>
                COMMUNITY HIGHLIGHTS
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Verified professional networks with strict moderation, zero-spam rules, and direct peer networking.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip icon={<StarIcon sx={{ fontSize: 14 }} />} label="Verified Circles" size="small" />
                <Chip icon={<ExploreIcon sx={{ fontSize: 14 }} />} label="Global Chapters" size="small" />
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filter Categories */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              color={selectedCategory === cat ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(cat)}
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                py: 2,
                px: 1,
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Community Cards Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : communities.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '24px' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No communities found matching your search.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Be the pioneer! Create a community for your specialization or interest group.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
            Create Community
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {communities.map((comm) => (
            <Grid item xs={12} sm={6} md={4} key={comm.id}>
              <CommunityCard community={comm} onJoinToggle={handleJoinToggle} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Community Creation Dialog */}
      <CommunityCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(newComm) => {
          setCommunities([newComm, ...communities]);
        }}
      />
    </Container>
  );
}
