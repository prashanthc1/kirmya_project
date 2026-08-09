'use client';

import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box, Stack, Paper } from '@mui/material';
import { ReadinessScoreMeter } from '@/components/interview-prep/ReadinessScoreMeter';
import { ReadinessRadarChart } from '@/components/interview-prep/ReadinessRadarChart';
import { InterviewPrepAPI } from '@/features/interview-prep/api';
import { InterviewReadinessScore } from '@/features/interview-prep/types';

export default function ReadinessProgressPage() {
  const [score, setScore] = useState<InterviewReadinessScore | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScore() {
      try {
        const data = await InterviewPrepAPI.getReadinessScore();
        setScore(data);
      } catch (err) {
        console.error('Failed to load readiness score', err);
      } finally {
        setLoading(false);
      }
    }
    loadScore();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#F8FAFC' }}>
          Readiness & Skills Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: '#94A3B8' }}>
          Track your interview readiness score, technical depth, behavioral STAR proficiency, and communication metrics.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <ReadinessScoreMeter score={score} />
        </Grid>
        <Grid item xs={12} md={7}>
          <ReadinessRadarChart score={score} />
        </Grid>
      </Grid>
    </Container>
  );
}
