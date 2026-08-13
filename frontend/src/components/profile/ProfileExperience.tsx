'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider, Chip } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import { WorkExperienceItem } from '../../features/profile/services/profileApi';

export const ProfileExperience: React.FC<{ experiences?: WorkExperienceItem[] }> = ({ experiences = [] }) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <WorkIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Work Experience
        </Typography>
      </Stack>

      {experiences.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No work experiences added yet.
        </Typography>
      ) : (
        <Stack spacing={2.5} divider={<Divider />}>
          {experiences.map((exp, idx) => (
            <Box key={exp.id || idx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {exp.jobTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {exp.company} • {exp.employmentType || 'Full-time'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate || 'Present'} • {exp.location || 'Remote'}
                  </Typography>
                </Box>
                {exp.isCurrentJob && <Chip label="Current" color="success" size="small" sx={{ fontWeight: 800 }} />}
              </Stack>
              {exp.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                  {exp.description}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileExperience;
