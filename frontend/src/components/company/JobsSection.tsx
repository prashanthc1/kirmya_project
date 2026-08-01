'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Stack,
  Button,
  Chip,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import GlassCard from '../landing/GlassCard';

interface JobsSectionProps {
  jobs: any[];
}

export const JobsSection: React.FC<JobsSectionProps> = ({ jobs }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [savedJobs, setSavedJobs] = useState<{ [key: string]: boolean }>({});

  const toggleSave = (id: string) => {
    setSavedJobs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <GlassCard id="open-jobs-section" sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <WorkIcon sx={{ color: '#10b981', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Open Job Positions ({jobs.length})
          </Typography>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        {jobs.map((job) => {
          const isSaved = !!savedJobs[job.id];
          return (
            <Grid item xs={12} md={6} key={job.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3, mb: 0.5 }}>
                        {job.title}
                      </Typography>
                      <Chip label={job.department} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </Box>
                    <IconButton size="small" onClick={() => toggleSave(job.id)} color={isSaved ? 'warning' : 'default'}>
                      {isSaved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                    </IconButton>
                  </Stack>

                  <Stack spacing={1} sx={{ my: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon fontSize="small" color="primary" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {job.location}
                        </Typography>
                      </Box>
                      <Chip label={job.employmentType} size="small" color="secondary" sx={{ fontSize: '0.65rem' }} />
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AttachMoneyIcon fontSize="small" sx={{ color: '#10b981' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981' }}>
                          {job.salaryRange}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Posted {job.postedDate}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<FlashOnIcon />}
                    sx={{
                      borderRadius: '10px',
                      fontWeight: 800,
                      textTransform: 'none',
                      flexGrow: 1,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                  >
                    Quick Apply
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </GlassCard>
  );
};

export default JobsSection;
