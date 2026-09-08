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

  /*
   * F15, the same defect as the AI section's eyebrow: #ec4899 on a 15% wash of
   * itself reads 4.33:1 in dark mode at 13px bold. Per-mode label, decoration
   * unchanged. #f472b6 on the dark composite = 5.77:1; #9d174d on the light
   * one = 6.27:1.
   */
  const accent = isDark ? '#f472b6' : '#9d174d';

  /*
   * F08, again. This panel used to render three invented people — named, given
   * job titles at real employers, credited with specific mutual-connection
   * counts, each behind a live "Connect" button. A visitor had no way to tell
   * them from the product's real output, and clicking Connect took them to
   * signup for a network that contained none of them.
   *
   * What replaces it describes how referrals actually work here. It makes no
   * claim about who is on the platform, so there is nothing to be wrong about.
   */
  const referralSteps = [
    {
      title: 'Find people at the company',
      detail: 'See which members already work where you are applying, and what they do there.',
    },
    {
      title: 'Ask for the referral',
      detail: 'Send a request against a specific posting, so it arrives with the role attached.',
    },
    {
      title: 'Keep the conversation',
      detail: 'Messages stay in one thread, so you can follow up without starting over.',
    },
  ];

  return (
    <Box id="networking" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          {/* Left Column: Network Value Prop */}
          <Grid item xs={12} md={6}>
            <Chip
              icon={<PeopleIcon sx={{ color: `${accent} !important` }} />}
              label="AUTHENTIC NETWORKING & REFERRALS"
              sx={{
                fontWeight: 800,
                px: 1,
                mb: 2,
                bgcolor: 'rgba(236, 72, 153, 0.15)',
                color: accent,
                border: '1px solid rgba(236, 72, 153, 0.3)',
              }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, color: 'text.primary' }}>
              Grow Your Professional Network & Secure Referrals
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7, fontSize: '1.05rem' }}>
              A referral puts your application in front of someone who can speak for it. Kirmya shows you who at a company is already on the platform, and gives you one place to ask.
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

          {/* Right Column: how a referral actually happens */}
          <Grid item xs={12} md={6}>
            <GlassCard sx={{ p: 3.5 }}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 800, mb: 2.5 }}>
                How a referral happens
              </Typography>
              <Stack spacing={2} component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {referralSteps.map((step, idx) => (
                  <Paper
                    key={step.title}
                    component="li"
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      aria-hidden
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        fontWeight: 800,
                        width: 42,
                        height: 42,
                      }}
                    >
                      {idx + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                        {step.detail}
                      </Typography>
                    </Box>
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
