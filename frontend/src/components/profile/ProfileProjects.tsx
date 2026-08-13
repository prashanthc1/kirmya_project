'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider, Link as MuiLink } from '@mui/material';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import LaunchIcon from '@mui/icons-material/Launch';

export const ProfileProjects: React.FC<{ projects?: any[] }> = ({ projects = [] }) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <FolderSpecialIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Featured Projects & Portfolio
        </Typography>
      </Stack>

      {projects.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No projects showcased yet.
        </Typography>
      ) : (
        <Stack spacing={2} divider={<Divider />}>
          {projects.map((p, idx) => (
            <Box key={p.id || idx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {p.title}
              </Typography>
              {p.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {p.description}
                </Typography>
              )}
              {p.url && (
                <MuiLink href={p.url} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1, fontWeight: 700, fontSize: '0.85rem' }}>
                  View Project <LaunchIcon sx={{ fontSize: 14 }} />
                </MuiLink>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileProjects;
