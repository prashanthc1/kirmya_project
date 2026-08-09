'use client';

import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Chip, Button, LinearProgress } from '@mui/material';
import { Business, Work, Event, ArrowForward, Delete, CheckCircle } from '@mui/icons-material';
import { InterviewPreparation } from '@/features/interview-prep/types';
import Link from 'next/link';

interface PrepWorkspaceCardProps {
  prep: InterviewPreparation;
  onDelete?: (id: string) => void;
}

export const PrepWorkspaceCard: React.FC<PrepWorkspaceCardProps> = ({ prep, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
      case 'completed':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'in progress':
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const statusStyle = getStatusColor(prep.status);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3.5,
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#fff',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(96, 165, 250, 0.4)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Business sx={{ fontSize: '1.1rem', color: '#94A3B8' }} />
              <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                {prep.company_name}
              </Typography>
            </Stack>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#F8FAFC' }}>
              {prep.job_title}
            </Typography>
          </Box>

          <Chip
            label={prep.status}
            size="small"
            sx={{
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
              borderColor: statusStyle.border,
              fontWeight: 600,
              border: 1,
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
          <Chip label={prep.interview_type} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', color: '#CBD5E1' }} />
          <Chip label={prep.interview_round} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', color: '#CBD5E1' }} />
          <Chip label={prep.experience_level} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', color: '#CBD5E1' }} />
        </Stack>

        {/* Readiness Meter */}
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
              Readiness Score
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#60A5FA' }}>
              {prep.readiness_score}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={prep.readiness_score}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
              },
            }}
          />
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" pt={1} borderTop="1px solid rgba(255, 255, 255, 0.06)">
          {prep.interview_date ? (
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Event sx={{ fontSize: '0.95rem', color: '#94A3B8' }} />
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                {new Date(prep.interview_date).toLocaleDateString()}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Targeting: {prep.preparation_duration}
            </Typography>
          )}

          <Stack direction="row" spacing={1}>
            {onDelete && (
              <Button
                size="small"
                onClick={() => onDelete(prep.id)}
                sx={{ color: '#EF4444', minWidth: 'auto', px: 1, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
              >
                <Delete sx={{ fontSize: '1.1rem' }} />
              </Button>
            )}
            <Button
              component={Link}
              href={`/dashboard/interview-prep/${prep.id}`}
              size="small"
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.2)',
                color: '#60A5FA',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.3)' },
              }}
            >
              Open Prep Hub
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
