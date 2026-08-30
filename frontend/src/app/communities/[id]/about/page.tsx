'use client';

import React, { use, useState, useEffect } from 'react';
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
  Alert,
  Divider,
  Skeleton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import Link from 'next/link';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { communityApi } from '../../../../features/community/services/communityApi';
import { Community, CommunityMember } from '../../../../features/community/types';
import { CommunityHeader } from '../../../../components/community/CommunityHeader';
import { tokens } from '../../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function CommunityAboutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const communityId = resolvedParams?.id || 'comm-1';

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [comm, mList] = await Promise.all([
          communityApi.getCommunity(communityId),
          communityApi.getMembers(communityId).catch(() => []),
        ]);
        setCommunity(comm);
        setMembers(mList || []);
      } catch (err) {
        console.error('Failed to load community about info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [communityId]);

  const staffMembers = members.filter((m) => m.role === 'owner' || m.role === 'admin' || m.role === 'moderator');

  return (
    <AuthenticatedLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} data-testid="community-about-page">
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

            <Grid container spacing={3}>
              {/* Main Info */}
              <Grid item xs={12} md={8}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: `${tokens.radius.lg}px`,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon color="primary" /> About This Community
                  </Typography>

                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, mb: 3 }}>
                    {community.description}
                  </Typography>

                  <Divider sx={{ my: 2.5 }} />

                  {/* Rules Section */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GavelIcon color="primary" fontSize="small" /> Community Rules & Governance
                  </Typography>

                  {community.rules && community.rules.length > 0 ? (
                    <List disablePadding>
                      {community.rules.map((rule, idx) => (
                        <ListItem key={idx} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.25 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                              }}
                            >
                              {idx + 1}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {rule}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Standard Kirmya professional guidelines apply.
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Sidebar Info */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: `${tokens.radius.lg}px`,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 3,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                    Community Details
                  </Typography>

                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {community.isPrivate ? <LockIcon fontSize="small" color="action" /> : <PublicIcon fontSize="small" color="action" />}
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Visibility
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {community.isPrivate ? 'Private Circle' : 'Public Community'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CalendarMonthOutlinedIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Created
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {community.createdAt ? new Date(community.createdAt).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>

                    {community.location && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <LocationOnOutlinedIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Location Hub
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {community.location}
                          </Typography>
                        </Box>
                      </Stack>
                    )}
                  </Stack>
                </Paper>

                {/* Moderators Card */}
                {staffMembers.length > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: `${tokens.radius.lg}px`,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityOutlinedIcon color="primary" fontSize="small" /> Leadership & Moderators
                    </Typography>

                    <Stack spacing={1.5}>
                      {staffMembers.map((staff) => (
                        <Stack
                          key={staff.id}
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          component={Link}
                          href={`/profile/${encodeURIComponent(staff.userId)}`}
                          sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}
                        >
                          <Avatar src={staff.avatar} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 800 }}>
                            {staff.name ? staff.name[0].toUpperCase() : 'M'}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                              {staff.name}
                            </Typography>
                            <Chip label={staff.role} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, mt: 0.25 }} />
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
