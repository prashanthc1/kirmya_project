'use client';

import React from 'react';
import { Paper, Box, Typography, Grid } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import WorkIcon from '@mui/icons-material/Work';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { ResumeAnalytics as AnalyticsType } from '@/features/resume/types';

export const ResumeAnalytics: React.FC<{ analytics: AnalyticsType }> = ({ analytics }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        Resume Analytics & Visibility Metrics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0, 102, 255, 0.05)', border: '1px solid rgba(0, 102, 255, 0.15)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Views</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0066FF', mt: 0.5 }}>{analytics.totalViews}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(153, 51, 255, 0.05)', border: '1px solid rgba(153, 51, 255, 0.15)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Recruiter Views</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#9933FF', mt: 0.5 }}>{analytics.recruiterViews}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0, 204, 102, 0.05)', border: '1px solid rgba(0, 204, 102, 0.15)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>PDF Downloads</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#00CC66', mt: 0.5 }}>{analytics.totalDownloads}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255, 153, 0, 0.05)', border: '1px solid rgba(255, 153, 0, 0.15)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Avg Match Score</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF9900', mt: 0.5 }}>{analytics.avgMatchScore}%</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
