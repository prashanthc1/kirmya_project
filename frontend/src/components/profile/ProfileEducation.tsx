'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { EducationItem } from '../../features/profile/services/profileApi';

export const ProfileEducation: React.FC<{ educations?: EducationItem[] }> = ({ educations = [] }) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <SchoolIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Education & Credentials
        </Typography>
      </Stack>

      {educations.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No education details added yet.
        </Typography>
      ) : (
        <Stack spacing={2.5} divider={<Divider />}>
          {educations.map((edu, idx) => (
            <Box key={edu.id || idx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {edu.institution}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
              </Typography>

              {edu.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
