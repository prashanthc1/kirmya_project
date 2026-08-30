'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider, Link as MuiLink } from '@mui/material';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import { UserProject } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';

export const ProfileProjects: React.FC<{ projects?: UserProject[]; isOwner?: boolean }> = ({
  projects = [],
  isOwner = false,
}) => {
  if (projects.length === 0 && !isOwner) {
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
        <FolderSpecialOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Projects & Portfolio
        </Typography>
      </Stack>

      {projects.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No featured projects showcased yet.
        </Typography>
      ) : (
        <Stack spacing={2.5} divider={<Divider />}>
          {projects.map((p, idx) => (
            <Box key={p.id || idx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {p.title || p.name}
              </Typography>
              {p.role && (
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  {p.role}
                </Typography>
              )}
              {p.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                  {p.description}
                </Typography>
              )}
              {p.url && (
                <MuiLink
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 1,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
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
