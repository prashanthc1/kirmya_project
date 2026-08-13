'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider, Link as MuiLink } from '@mui/material';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import LaunchIcon from '@mui/icons-material/Launch';

export const ProfileCertifications: React.FC<{ certifications?: any[] }> = ({ certifications = [] }) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <CardMembershipIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Licenses & Certifications
        </Typography>
      </Stack>

      {certifications.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No certifications listed.
        </Typography>
      ) : (
        <Stack spacing={2} divider={<Divider />}>
          {certifications.map((cert, idx) => (
            <Box key={cert.id || idx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {cert.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                {cert.issuingOrganization}
              </Typography>
              {cert.credentialUrl && (
                <MuiLink href={cert.credentialUrl} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5, fontWeight: 700, fontSize: '0.85rem' }}>
                  Show Credential <LaunchIcon sx={{ fontSize: 14 }} />
                </MuiLink>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileCertifications;
