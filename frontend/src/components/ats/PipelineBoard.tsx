'use client';

import React, { useState } from 'react';
import { Box, Typography, Stack, Menu, MenuItem, useTheme } from '@mui/material';
import PipelineColumn from './PipelineColumn';
import GlassCard from '../landing/GlassCard';
import { JobApplicationDTO, ATSStage } from '../../features/ats/types';
import { atsApi } from '../../features/ats/api';
import { APPLICATION_STAGES, STAGE_COLORS } from '../../features/recruiter/stages';

interface PipelineBoardProps {
  applications: JobApplicationDTO[];
  onView: (app: JobApplicationDTO) => void;
  onSchedule: (app: JobApplicationDTO) => void;
  onRefresh: () => void;
  onSelectToggle?: (appId: string, selected: boolean) => void;
  selectedIds?: string[];
}

const STAGES = APPLICATION_STAGES.map((name) => ({ name, color: STAGE_COLORS[name] }));


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
