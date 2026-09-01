'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Alert,
  Skeleton,
} from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { companyApi } from '../../../features/company/services/companyApi';
import { tokens } from '../../../theme/tokens';

interface CompanyDetail {
  id: string;
  name: string;
  handle: string;
}

interface ProfileDetail {
  logoUrl?: string;
  coverUrl?: string;
  about?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  website?: string;
  foundedYear?: number;
  culture?: string;
  benefits?: string[];
  employeeInsights?: string;
  followersCount?: number;
  isVerified?: boolean;
}

interface PageProps {
  params?: Promise<{
    handle: string;
  }> | { handle: string };
}

export const dynamic = 'force-dynamic';

export default function CompanyDetailPage({ params }: PageProps) {
  const routeParams = useParams();
  const rawHandle = (routeParams?.handle as string) || '';
  const [handle, setHandle] = useState<string>(rawHandle);

  // States
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (params) {
      if (typeof (params as any).then === 'function') {
        (params as Promise<{ handle: string }>).then((p) => {
          if (p?.handle) setHandle(p.handle);
        });
      } else if ((params as any).handle) {
        setHandle((params as any).handle);
      }
    }
  }, [params]);

  const activeHandle = handle || rawHandle;

  const loadCompanyData = async (h: string) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await companyApi.getByHandle(h);
      setCompany(data?.company || null);
      setProfile(data?.profile || null);
      setFollowing(data?.following || false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Company not found or failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeHandle) {
      loadCompanyData(activeHandle);
    }
  }, [activeHandle]);

  const handleFollowToggle = async () => {
    if (!company) return;
    try {
      if (following) {
        await companyApi.unfollowCompany(company.id);
        setFollowing(false);
      } else {
        await companyApi.followCompany(company.id);
        setFollowing(true);
      }
    } catch (err) {
      console.error('Failed to update follow status:', err);
    }
  };

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Button
            component={Link}
            href="/companies"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
          >
            Back to Companies Directory
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Box>
        ) : errorMsg || !company ? (
          <Alert severity="error" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            {errorMsg || 'Company not found.'}
          </Alert>
        ) : (
          <Stack spacing={3}>
            {/* Company Banner & Profile Header */}
            <Card
              elevation={0}
              sx={{
                borderRadius: `${tokens.radius.lg}px`,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              {profile?.coverUrl && (
                <Box
                  sx={{
                    height: 180,
                    width: '100%',
                    bgcolor: 'primary.dark',
                    backgroundImage: `url(${profile.coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  spacing={2}
                >
                  <Stack direction="row" spacing={2.5} alignItems="center">
                    <Avatar
                      src={profile?.logoUrl}
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: `${tokens.radius.md}px`,
                        bgcolor: 'primary.main',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                      }}
                    >
                      {company.name ? company.name[0].toUpperCase() : 'C'}
                    </Avatar>

                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                          {company.name}
                        </Typography>
                        {profile?.isVerified && (
                          <VerifiedIcon color="primary" sx={{ fontSize: 24 }} />
                        )}
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.25 }}>
                        @{company.handle} • {profile?.industry || 'Enterprise'} • {profile?.location || 'Global'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                      variant={following ? 'outlined' : 'contained'}
                      onClick={handleFollowToggle}
                      sx={{
                        borderRadius: `${tokens.radius.sm}px`,
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 3,
                      }}
                    >
                      {following ? 'Following' : 'Follow'}
                    </Button>

                    <Button
                      component={Link}
                      href={`/company/${company.handle}`}
                      variant="outlined"
                      sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
                    >
                      Full Company Page
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Overview / Details Grid */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: `${tokens.radius.lg}px`,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                    About {company.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {profile?.about || 'No detailed description provided.'}
                  </Typography>

                  {profile?.culture && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                        Company Culture & Work Environment
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {profile.culture}
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: `${tokens.radius.lg}px`,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                    Company Facts
                  </Typography>

                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <LocationOnIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Headquarters</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {profile?.location || 'Worldwide'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <PeopleIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Company Size</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {profile?.companySize || 'Growing Team'}
                        </Typography>
                      </Box>
                    </Stack>

                    {profile?.foundedYear && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <CalendarTodayIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Founded</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {profile.foundedYear}
                          </Typography>
                        </Box>
                      </Stack>
                    )}

                    {profile?.website && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <LanguageIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Official Website</Typography>
                          <Typography
                            variant="body2"
                            component="a"
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none' }}
                          >
                            {profile.website}
                          </Typography>
                        </Box>
                      </Stack>
                    )}
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
