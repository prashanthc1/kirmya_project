'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, Avatar, Button, Chip, Stack } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import { CandidateInterview } from '@/features/applications/types';

interface InterviewDashboardProps {
  interviews: CandidateInterview[];
}

export const InterviewDashboard: React.FC<InterviewDashboardProps> = ({ interviews }) => {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Interview Workspace
      </Typography>

      <Grid container spacing={3}>
        {interviews.map((int) => (
          <Grid item xs={12} md={6} key={int.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(153, 51, 255, 0.3)',
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar src={int.company_logo} variant="rounded" sx={{ width: 48, height: 48 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                      {int.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {int.company_name} &bull; {int.job_title}
                    </Typography>
                  </Box>
                </Box>
                <Chip label={int.status} color="primary" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <EventIcon fontSize="small" sx={{ color: '#9933FF' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {new Date(int.scheduled_start).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">Interviewer: {int.interviewer}</Typography>
                </Box>
              </Stack>

              {int.notes && (
                <Box sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Preparation Notes
                  </Typography>
                  <Typography variant="body2">{int.notes}</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                {int.meeting_link && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<VideoCallIcon />}
                    component="a"
                    href={int.meeting_link}
                    target="_blank"
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #9933FF 0%, #00CCFF 100%)',
                    }}
                  >
                    Join Video Interview
                  </Button>
                )}
                <Button fullWidth variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                  Reschedule Request
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}

        {interviews.length === 0 && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, background: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                No interviews scheduled
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
