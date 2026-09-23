'use client';

import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Chip, Button } from '@mui/material';
import { PlayArrow, CheckCircle, Assessment, Event } from '@mui/icons-material';
import { MockInterviewSession } from '@/features/interview-prep/types';
import Link from 'next/link';

interface MockSessionCardProps {
  session: MockInterviewSession;
}

export const MockSessionCard: React.FC<MockSessionCardProps> = ({ session }) => {
  const isCompleted = session.status.toLowerCase() === 'completed';

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3.5,
        bgcolor: "background.paper",
        backdropFilter: 'blur(12px)',
        border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
        color: "text.primary",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: "text.primary" }}>
              {session.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
              <Chip label={session.interview_type} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: "primary.main" }} />
              <Chip label={session.difficulty} size="small" sx={{ bgcolor: "action.hover", color: "text.secondary" }} />
            </Stack>
          </Box>

          <Chip
            label={session.status}
            size="small"
            sx={{
              bgcolor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isCompleted ? '#34D399' : '#FBBF24',
              fontWeight: 600,
            }}
          />
        </Stack>

        <Stack direction="row" spacing={3} sx={{ my: 2, p: 1.5, borderRadius: 2.5, bgcolor: "background.paper" }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Overall Score</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: "primary.main" }}>
              {session.overall_score || '--'}/100
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Questions</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: "text.primary" }}>
              {session.completed_questions}/{session.total_questions}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>STAR Structure</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: "primary.main" }}>
              {session.structure_score || '--'}%
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {new Date(session.started_at).toLocaleDateString()}
          </Typography>

          <Button
            component={Link}
            href={`/dashboard/interview-prep/mock?session_id=${session.id}`}
            size="small"
            variant="contained"
            startIcon={isCompleted ? <Assessment /> : <PlayArrow />}
            sx={{
              bgcolor: isCompleted ? 'rgba(16, 185, 129, 0.2)' : "primary.main",
              color: isCompleted ? '#34D399' : "primary.contrastText",
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            {isCompleted ? 'View Full Feedback Report' : 'Resume Practice Session'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
