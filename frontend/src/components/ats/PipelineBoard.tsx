'use client';

import React, { useState } from 'react';
import { Box, Typography, Stack, Menu, MenuItem, useTheme } from '@mui/material';
import PipelineColumn from './PipelineColumn';
import GlassCard from '../landing/GlassCard';
import { JobApplicationDTO, ATSStage } from '../../features/ats/types';
import { atsApi } from '../../features/ats/api';

interface PipelineBoardProps {
  applications: JobApplicationDTO[];
  onView: (app: JobApplicationDTO) => void;
  onSchedule: (app: JobApplicationDTO) => void;
  onRefresh: () => void;
  onSelectToggle?: (appId: string, selected: boolean) => void;
  selectedIds?: string[];
}

const STAGES: { name: ATSStage; color: string }[] = [
  { name: 'Applied', color: '#6366f1' },
  { name: 'Screening', color: '#06b6d4' },
  { name: 'Shortlisted', color: '#3b82f6' },
  { name: 'Recruiter Review', color: '#8b5cf6' },
  { name: 'Interview', color: '#f59e0b' },
  { name: 'Technical Round', color: '#ec4899' },
  { name: 'Final Interview', color: '#a855f7' },
  { name: 'Offer', color: '#10b981' },
  { name: 'Hired', color: '#16a34a' },
  { name: 'Rejected', color: '#ef4444' },
];

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  applications,
  onView,
  onSchedule,
  onRefresh,
  onSelectToggle,
  selectedIds = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleReject = async (app: JobApplicationDTO) => {
    try {
      await atsApi.updateApplicationStage(app.id, 'Rejected', 'Application marked rejected by recruiter');
      onRefresh();
    } catch {
      onRefresh();
    }
  };

  return (
    <GlassCard sx={{ p: { xs: 2, md: 3 }, overflowX: 'auto', mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, minWidth: 1600, pb: 2 }}>
        {STAGES.map((st) => {
          const columnApps = applications.filter((a) => a.currentStage.toLowerCase() === st.name.toLowerCase());
          return (
            <PipelineColumn
              key={st.name}
              stage={st.name}
              applications={columnApps}
              color={st.color}
              onView={onView}
              onSchedule={onSchedule}
              onReject={handleReject}
              onSelectToggle={onSelectToggle}
              selectedIds={selectedIds}
            />
          );
        })}
      </Box>
    </GlassCard>
  );
};

export default PipelineBoard;
