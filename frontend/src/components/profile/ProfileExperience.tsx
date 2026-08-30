'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider, Chip } from '@mui/material';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import { WorkExperienceItem } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';

export const ProfileExperience: React.FC<{ experiences?: WorkExperienceItem[]; isOwner?: boolean }> = ({
  experiences = [],
  isOwner = false,
}) => {
  if (experiences.length === 0 && !isOwner) {
    return null;
  }

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        p: { xs: 2.5, sm: 3.5 },
        mb: 3,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
        <WorkOutlineIcon color="primary" sx={{ fontSize: 22 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Work Experience
        </Typography>
      </Stack>

      {experiences.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No work experiences added yet.
        </Typography>
      ) : (
        <Stack spacing={2.5} divider={<Divider />}>
          {experiences.map((exp, idx) => (
            <Box key={exp.id || idx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {exp.jobTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {exp.company} {exp.employmentType ? `• ${exp.employmentType}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {exp.startDate} – {exp.isCurrentJob ? 'Present' : exp.endDate || 'Present'}
                    {exp.location ? ` • ${exp.location}` : ''}
                  </Typography>
                </Box>
                {exp.isCurrentJob && (
                  <Chip label="Current" color="success" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                )}
              </Stack>
              {exp.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
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
