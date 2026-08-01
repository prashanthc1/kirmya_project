'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Grid, Typography, Button, Stack, Avatar, Chip, Paper, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ChatIcon from '@mui/icons-material/Chat';
import SchoolIcon from '@mui/icons-material/School';
import GlassCard from './GlassCard';

export const NetworkingSection: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const connectionSamples = [
    { name: 'Sarah Chen', role: 'Staff Cloud Architect', company: 'Amazon Web Services', mutual: '14 Mutual Connections', avatar: 'S' },
    { name: 'Tariq Al-Mansoor', role: 'VP of Engineering', company: 'Hyperion Labs', mutual: '8 Mutual Connections', avatar: 'T' },
    { name: 'Elena Rostova', role: 'Senior AI Engineer', company: 'Nexus AI', mutual: '21 Mutual Connections', avatar: 'E' },
  ];

  return (
    <Box id="networking" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          {/* Left Column: Network Value Prop */}
          <Grid item xs={12} md={6}>
            <Chip
              icon={<PeopleIcon sx={{ color: '#ec4899 !important' }} />}
              label="AUTHENTIC NETWORKING & REFERRALS"
              sx={{
                fontWeight: 800,
                px: 1,
                mb: 2,
                bgcolor: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                border: '1px solid rgba(236, 72, 153, 0.3)',
              }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, color: 'text.primary' }}>
              Grow Your Professional Network & Secure Referrals
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7, fontSize: '1.05rem' }}>
              Over 70% of open positions are filled through internal referrals. Kirmya connects you with verified industry insiders who can champion your application.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={6}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CardGiftcardIcon sx={{ color: '#ec4899' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Internal Employee Referrals
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ChatIcon sx={{ color: '#6366f1' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Direct Encrypted Messaging
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <SchoolIcon sx={{ color: '#10b981' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    1-on-1 Executive Mentorship
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PeopleIcon sx={{ color: '#f59e0b' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    AI People Recommendations
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/signup')}
              sx={{
                py: 1.6,
                px: 4,
                borderRadius: '12px',
                fontWeight: 800,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)',
              }}
            >
              Start Building Your Network
            </Button>
          </Grid>

          {/* Right Column: Connection Cards Preview */}
          <Grid item xs={12} md={6}>
            <GlassCard sx={{ p: 3.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>
                People You May Know & Referral Advocates
              </Typography>
              <Stack spacing={2}>
                {connectionSamples.map((p, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800, width: 42, height: 42 }}>
                        {p.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {p.role} at {p.company}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                          {p.mutual}
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => router.push('/signup')}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 2,
                      }}
                    >
                      Connect
                    </Button>
                  </Paper>
                ))}
              </Stack>
            </GlassCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default NetworkingSection;
