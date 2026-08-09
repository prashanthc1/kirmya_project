'use client';

import React from 'react';
import { Box, Typography, Paper, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { ApplicationTimelineItem } from '@/features/applications/types';

interface ApplicationTimelineProps {
  timeline: ApplicationTimelineItem[];
  currentStatus: string;
}

const ALL_STAGES = ['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Offer', 'Accepted'];

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({ timeline, currentStatus }) => {
  const getActiveStep = () => {
    const idx = ALL_STAGES.indexOf(currentStatus);
    return idx >= 0 ? idx : ALL_STAGES.length - 1;
  };

  const activeStep = getActiveStep();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        Application Hiring Journey
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {ALL_STAGES.map((stage, index) => {
          const matchedItem = timeline.find((t) => t.status.toLowerCase() === stage.toLowerCase());
          const isCompleted = index <= activeStep;

          return (
            <Step key={stage} active={index === activeStep} completed={isCompleted}>
              <StepLabel
                StepIconComponent={() =>
                  isCompleted ? (
                    <CheckCircleIcon sx={{ color: '#00CC66' }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} />
                  )
                }
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isCompleted ? 'text.primary' : 'text.secondary' }}>
                  {stage}
                </Typography>
                {matchedItem && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {new Date(matchedItem.date).toLocaleDateString()} &bull; Moved by {matchedItem.moved_by}
                  </Typography>
                )}
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {matchedItem ? matchedItem.description : `Stage status: ${stage}`}
                  </Typography>
                </Box>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
};
