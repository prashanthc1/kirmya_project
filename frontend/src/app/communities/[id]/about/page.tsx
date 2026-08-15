'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityIcon from '@mui/icons-material/Security';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community, CommunityMember } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';

export default function CommunityAboutPage() {
  const params = useParams();
  const communityId = (params?.id as string) || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [comm, mList] = await Promise.all([
          communityApi.getCommunity(communityId),
          communityApi.getMembers(communityId),
        ]);
        setCommunity(comm);
        setMembers(mList);
      } catch (err) {
        console.error('Failed to load community about info:', err);
      } finally {
        setLoading(false);
      }
    }
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

  const staffMembers = members.filter((m) => m.role === 'owner' || m.role === 'admin' || m.role === 'moderator');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="community-about-page">
      <CommunityHeader community={community} />

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '20px',
              background: (theme) =>
                theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
              backdropFilter: 'blur(16px)',
              border: (theme) =>
                theme.palette.mode === 'light'
                  ? '1px solid rgba(99, 102, 241, 0.15)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              mb: 3,
            }}
          >
            <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="primary" /> About This Community
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
              {community.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Rules */}
            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GavelIcon color="primary" /> Community Rules & Governance
            </Typography>
            <List>
              {community.rules.map((rule, idx) => (
                <ListItem key={idx} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    <Chip
                      label={idx + 1}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 700, height: 24, width: 24, borderRadius: '50%' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={rule}
                    primaryTypographyProps={{ fontWeight: 600, variant: 'body1' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Sidebar Info */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Metadata Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '20px',
                background: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
                backdropFilter: 'blur(16px)',
                border: (theme) =>
                  theme.palette.mode === 'light'
                    ? '1px solid rgba(99, 102, 241, 0.15)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Community Metadata
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {community.isPrivate ? <LockIcon color="secondary" /> : <PublicIcon color="primary" />}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {community.isPrivate ? 'Private Circle' : 'Public Community'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {community.isPrivate ? 'Approval required to join' : 'Open for all members'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocationOnIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {community.location || 'Global Remote'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Location / Primary Region
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarMonthIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Created {new Date(community.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Establishment Date
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>

            {/* Leadership & Moderators */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '20px',
                background: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
                backdropFilter: 'blur(16px)',
                border: (theme) =>
                  theme.palette.mode === 'light'
                    ? '1px solid rgba(99, 102, 241, 0.15)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" /> Leadership & Moderation Team
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {staffMembers.map((staff) => (
                  <Box key={staff.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={staff.avatar}>{staff.name.charAt(0)}</Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {staff.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {staff.title || staff.company || 'Team Lead'}
                      </Typography>
                    </Box>
                    <Chip
                      label={staff.role}
                      size="small"
                      color={staff.role === 'owner' ? 'error' : staff.role === 'admin' ? 'secondary' : 'info'}
                      sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
