'use client';

import React from 'react';
import { Paper, Typography, Stack, Chip, useTheme } from '@mui/material';
import CandidateCard from './CandidateCard';
import { JobApplicationDTO, ATSStage } from '../../features/ats/types';

interface PipelineColumnProps {
  stage: ATSStage;
  applications: JobApplicationDTO[];
  color: string;
  onView: (app: JobApplicationDTO) => void;
  onSchedule: (app: JobApplicationDTO) => void;
  onReject: (app: JobApplicationDTO) => void;
  onSelectToggle?: (appId: string, selected: boolean) => void;
  selectedIds?: string[];
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stage,
  applications,
  color,
  onView,
  onSchedule,
  onReject,
  onSelectToggle,
  selectedIds = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 260,
        maxWidth: 320,
        p: 2,
        borderRadius: '16px',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Paper elevation={0} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
            {stage}
          </Typography>
        </Stack>
        <Chip label={applications.length} size="small" sx={{ fontWeight: 800, bgcolor: `${color}20`, color: color, height: 20 }} />
      </Stack>

      <Stack spacing={1.5} sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 380 }}>
        {applications.map((app) => (
          <CandidateCard
            key={app.id}
            application={app}
            onView={onView}
            onSchedule={onSchedule}
            onReject={onReject}
            onSelectToggle={onSelectToggle}
            isSelected={selectedIds.includes(app.id)}
          />
        ))}
      </Stack>
    </Paper>
  );
};

export default PipelineColumn;
