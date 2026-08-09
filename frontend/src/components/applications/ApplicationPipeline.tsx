'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, Stack } from '@mui/material';
import { ApplicationSummary, ApplicationStage } from '@/features/applications/types';
import { ApplicationCard } from './ApplicationCard';

interface ApplicationPipelineProps {
  applications: ApplicationSummary[];
  viewMode: 'kanban' | 'list';
  onViewDetails: (app: ApplicationSummary) => void;
  onMessageRecruiter?: (app: ApplicationSummary) => void;
  onWithdraw?: (app: ApplicationSummary) => void;
  onToggleSave?: (app: ApplicationSummary) => void;
}

const STAGES: ApplicationStage[] = ['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Offer', 'Accepted', 'Rejected'];

export const ApplicationPipeline: React.FC<ApplicationPipelineProps> = ({
  applications,
  viewMode,
  onViewDetails,
  onMessageRecruiter,
  onWithdraw,
  onToggleSave,
}) => {
  if (viewMode === 'list') {
    return (
      <Grid container spacing={2}>
        {applications.map((app) => (
          <Grid item xs={12} md={6} key={app.id}>
            <ApplicationCard
              application={app}
              onViewDetails={onViewDetails}
              onMessageRecruiter={onMessageRecruiter}
              onWithdraw={onWithdraw}
              onToggleSave={onToggleSave}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
      {STAGES.map((stage) => {
        const stageApps = applications.filter((a) => a.current_status === stage);
        return (
          <Paper
            key={stage}
            elevation={0}
            sx={{
              minWidth: 320,
              width: 320,
              p: 2,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {stage}
              </Typography>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.2,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 102, 255, 0.15)',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {stageApps.length}
              </Box>
            </Box>

            <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 200 }}>
              {stageApps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onViewDetails={onViewDetails}
                  onMessageRecruiter={onMessageRecruiter}
                  onWithdraw={onWithdraw}
                  onToggleSave={onToggleSave}
                />
              ))}
              {stageApps.length === 0 && (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    No applications in {stage}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
};
