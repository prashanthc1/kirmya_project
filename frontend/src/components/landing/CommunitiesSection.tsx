'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Grid, Typography, Stack, Chip, Button, useTheme } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import ForumIcon from '@mui/icons-material/Forum';
import GlassCard from './GlassCard';

export const CommunitiesSection: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();

  const communities = [
    { title: 'Facilities Management Guild', category: 'Industry Group', members: '14,200 members', icon: <GroupsIcon sx={{ color: '#6366f1' }} /> },
    { title: 'Tech & AI Innovators Hub', category: 'Career Discussions', members: '32,800 members', icon: <ForumIcon sx={{ color: '#ec4899' }} /> },
    { title: 'Global Career Transition Network', category: 'Peer Support', members: '48,500 members', icon: <VolunteerActivismIcon sx={{ color: '#10b981' }} /> },
    { title: 'Marketing & Brand Leaders', category: 'Industry Group', members: '18,400 members', icon: <GroupsIcon sx={{ color: '#f59e0b' }} /> },
    { title: 'Executive Upskilling & Certifications', category: 'Learning Group', members: '24,100 members', icon: <SchoolIcon sx={{ color: '#06b6d4' }} /> },
    { title: 'Global Tech Summits & Webinars', category: 'Events', members: '12,600 attendees', icon: <EventIcon sx={{ color: '#8b5cf6' }} /> },
  ];

  return (
    <Box id="communities" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              color: 'primary.main',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1,
            }}
          >
            PEER SUPPORT & GUILDS
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
            Professional Communities & Events
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', fontSize: '1.05rem' }}>
            Engage in specialized industry guilds, participate in live workshops, and exchange referral leads with fellow members.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {communities.map((comm, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <GlassCard sx={{ height: '100%', p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {comm.icon}
                    </Box>
                    <Chip label={comm.category} size="small" variant="outlined" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                  </Stack>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.3 }}>
                    {comm.title}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {comm.members}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => router.push('/signup')}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Join Community
                    </Button>
                  </Stack>
                </Stack>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default CommunitiesSection;
