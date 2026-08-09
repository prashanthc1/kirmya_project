'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Stack } from '@mui/material';
import { PracticeHistoryTable } from '@/components/interview-prep/PracticeHistoryTable';
import { InterviewPrepAPI } from '@/features/interview-prep/api';
import { MockInterviewSession } from '@/features/interview-prep/types';

export default function PracticeHistoryPage() {
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const sList = await InterviewPrepAPI.listMockSessions();
        setSessions(sList);
      } catch (err) {
        console.error('Failed to load session history', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#F8FAFC' }}>
          Mock Sessions & Practice History
        </Typography>
        <Typography variant="body1" sx={{ color: '#94A3B8' }}>
          Review scores, feedback reports, and performance trends across past AI practice sessions.
        </Typography>
      </Box>

      <PracticeHistoryTable sessions={sessions} />
    </Container>
  );
}
