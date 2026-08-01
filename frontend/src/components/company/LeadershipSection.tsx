'use client';

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  IconButton,
  useTheme,
} from '@mui/material';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GlassCard from '../landing/GlassCard';

interface LeadershipSectionProps {
  leaders: any[];
}

export const LeadershipSection: React.FC<LeadershipSectionProps> = ({ leaders }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <SupervisorAccountIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Executive Leadership Team
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {leaders.map((leader) => (
          <Grid item xs={12} md={6} key={leader.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                gap: 2.5,
              }}
            >
              <Avatar
                src={leader.photoUrl || undefined}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: 'primary.main',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                }}
              >
                {leader.name[0]}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {leader.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 1 }}>
                      {leader.designation}
                    </Typography>
                  </Box>

                  {leader.linkedinUrl && (
                    <IconButton
                      component="a"
                      href={leader.linkedinUrl}
                      target="_blank"
                      size="small"
                      sx={{ color: '#0077b5' }}
                    >
                      <LinkedInIcon />
                    </IconButton>
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {leader.summary}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </GlassCard>
  );
};

export default LeadershipSection;
