'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { CandidateInterview } from '@/features/applications/types';

export function InterviewDashboard({ interviews = [] }: { interviews?: CandidateInterview[] }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Upcoming Interviews</Typography>
      {interviews.length === 0 && <Typography>No upcoming interviews.</Typography>}
      {interviews.map(interview => (
        <Card key={interview.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1">{interview.title}</Typography>
            <Typography color="text.secondary">{new Date(interview.scheduled_start).toLocaleString()}</Typography>
            {interview.meeting_link && (
              <Button href={interview.meeting_link} target="_blank" sx={{ mt: 1 }}>Join Meeting</Button>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
