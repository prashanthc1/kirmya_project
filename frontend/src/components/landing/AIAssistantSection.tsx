'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack, Chip, Paper, Avatar, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GlassCard from './GlassCard';

export const AIAssistantSection: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const aiCards = [
    { title: 'AI Resume Review', desc: 'Detailed scoring & bullet point recommendations to pass ATS screeners.' },
    { title: 'AI Profile Optimization', desc: 'Enhance headline, summary, and skills for maximum recruiter visibility.' },
    { title: 'Interview Coach', desc: 'Practice behavioral and technical questions with AI voice & response feedback.' },
    { title: 'Career Coach', desc: 'Get 24/7 strategic guidance on salary negotiation, career shifts, and promotions.' },
    { title: 'Job Matching', desc: 'Automated skill vector matching against live job descriptions.' },
    { title: 'Learning Recommendations', desc: 'Discover high-demand certifications & skills tailored to your career path.' },
    { title: 'Career Progress Tracking', desc: 'Monitor your application response rate and profile strength over time.' },
  ];

  return (
    <Box id="ai-assistant" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          {/* Left Column: AI Capabilities */}
          <Grid item xs={12} md={6}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ color: '#a855f7 !important' }} />}
              label="NEXT-GEN CAREER AI"
              sx={{
                fontWeight: 800,
                px: 1,
                mb: 2,
                bgcolor: 'rgba(168, 85, 247, 0.15)',
                color: '#a855f7',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, color: 'text.primary' }}>
              Your 24/7 AI Career Companion
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7, fontSize: '1.05rem' }}>
              Kirmya AI combines deep learning match algorithms with industry-specific career coaching to prepare you for every stage of hiring.
            </Typography>

            <Grid container spacing={2}>
              {aiCards.map((card, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <CheckCircleOutlineIcon sx={{ color: '#a855f7', fontSize: 20, mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {card.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                        {card.desc}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Right Column: Interactive AI Chat Simulation */}
          <Grid item xs={12} md={6}>
            <GlassCard
              glowColor="rgba(168, 85, 247, 0.3)"
              sx={{ border: '1px solid rgba(168, 85, 247, 0.3)' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Avatar sx={{ bgcolor: '#a855f7', width: 44, height: 44, fontWeight: 900 }}>AI</Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Kirmya Career Coach
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 600 }}>
                    Online • Neural Engine Ready
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)',
                    maxWidth: '88%',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    Hello! I reviewed your profile. Your experience aligns <strong>94%</strong> with <strong>Senior Operations Lead</strong>. Would you like me to optimize your resume bullets for vendor contract management?
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    bgcolor: '#6366f1',
                    color: '#ffffff',
                    maxWidth: '80%',
                    alignSelf: 'flex-end',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Yes! Please show me an example bullet point for vendor SLA achievements.
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)',
                    maxWidth: '88%',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 800, display: 'block', mb: 0.5 }}>
                    ✨ AI Suggested Bullet:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                    "Managed 18+ vendor SLA contracts valued at $4.2M, improving service uptime to 99.4% and cutting annual procurement costs by 14%."
                  </Typography>
                </Paper>
              </Stack>
            </GlassCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AIAssistantSection;
