'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider } from '@mui/material';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { EducationItem } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';

export const ProfileEducation: React.FC<{ educations?: EducationItem[]; isOwner?: boolean }> = ({
  educations = [],
  isOwner = false,
}) => {
  if (educations.length === 0 && !isOwner) {
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
        <SchoolOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Education & Degrees
        </Typography>
      </Stack>

      {educations.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No education history listed yet.
        </Typography>
      ) : (
        <Stack spacing={2.5} divider={<Divider />}>
          {educations.map((edu, idx) => (
            <Box key={edu.id || idx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {edu.institution}
              </Typography>
              {(edu.startDate || edu.endDate || edu.grade) && (
                <Typography variant="caption" color="text.secondary">
                  {[edu.startDate && `${edu.startDate} – ${edu.endDate || 'Present'}`, edu.grade && `Grade: ${edu.grade}`]
                    .filter(Boolean)
                    .join(' • ')}
                </Typography>
              )}
              {edu.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                  {edu.description}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileEducation;
