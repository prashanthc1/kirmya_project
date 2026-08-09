'use client';

import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  Visibility as ViewsIcon,
  WorkOutline as AppsIcon,
  Download as DownloadIcon,
  Star as MatchIcon,
} from '@mui/icons-material';
import { CoverLetterAnalytics as AnalyticsType } from '@/features/cover-letter/types';

export interface CoverLetterAnalyticsProps {
  analytics: AnalyticsType;
}

export const CoverLetterAnalyticsComponent: React.FC<CoverLetterAnalyticsProps> = ({ analytics }) => {
  const STATS = [
    { title: 'Total Views', value: analytics.totalViews, icon: <ViewsIcon color="primary" />, color: '#818cf8' },
    { title: 'Recruiter Views', value: analytics.recruiterViews, icon: <ViewsIcon color="secondary" />, color: '#c084fc' },
    { title: 'Total Downloads', value: analytics.totalDownloads, icon: <DownloadIcon sx={{ color: '#38bdf8' }} />, color: '#38bdf8' },
    { title: 'Applications Used', value: analytics.applicationsUsedCount, icon: <AppsIcon sx={{ color: '#34d399' }} />, color: '#34d399' },
    { title: 'Avg Match Score', value: `${analytics.avgMatchScore}%`, icon: <MatchIcon sx={{ color: '#fbbf24' }} />, color: '#fbbf24' },
  ];

  return (
    <Grid container spacing={2}>
      {STATS.map((s, idx) => (
        <Grid item xs={6} sm={4} md={2.4} key={idx}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                {s.icon}
                <Typography variant="h5" fontWeight={800} color={s.color}>
                  {s.value}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {s.title}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
