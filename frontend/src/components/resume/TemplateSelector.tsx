'use client';

import React from 'react';
import { Grid, Paper, Box, Typography, Button, Chip, Stack } from '@mui/material';
import { surfaceTransition } from '../../theme/motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import { ResumeTemplate } from '@/features/resume/types';

interface TemplateSelectorProps {
  templates: ResumeTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  return (
    <Grid container spacing={3}>
      {templates.map((tpl) => {
        const isSelected = tpl.id === selectedTemplateId;
        return (
          <Grid item xs={12} sm={6} md={4} key={tpl.id}>
            <Paper
              elevation={0}
              onClick={() => onSelectTemplate(tpl.id)}
              sx={{
                p: 2.5,
                borderRadius: 3,
                cursor: 'pointer',
                background: isSelected ? 'rgba(0, 102, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '2px solid #0066FF' : '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                transition: surfaceTransition(0.2),
                position: 'relative',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {isSelected && (
                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                  <CheckCircleIcon sx={{ color: '#0066FF', fontSize: 26 }} />
                </Box>
              )}

              {/* Template Mock Visual */}
              <Box
                sx={{
                  height: 140,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  p: 2,
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ height: 12, width: '40%', bgcolor: 'primary.main', borderRadius: 1 }} />
                <Box sx={{ height: 6, width: '70%', bgcolor: 'rgba(255, 255, 255, 0.3)', borderRadius: 1 }} />
                <Box sx={{ height: 1, bgcolor: 'rgba(255, 255, 255, 0.1)', my: 0.5 }} />
                <Box sx={{ height: 6, width: '90%', bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 1 }} />
                <Box sx={{ height: 6, width: '85%', bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 1 }} />
                <Box sx={{ height: 6, width: '60%', bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 1 }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {tpl.name}
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2, height: 36 }}>
                {tpl.description}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Chip
                  label={`${tpl.atsCompatibility}% ATS Compatible`}
                  icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#00CC66' }} />}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(0, 204, 102, 0.1)',
                    color: '#00CC66',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {tpl.category}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};
