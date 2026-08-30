'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider, Link as MuiLink } from '@mui/material';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import { UserCertification } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';

export const ProfileCertifications: React.FC<{ certifications?: UserCertification[]; isOwner?: boolean }> = ({
  certifications = [],
  isOwner = false,
}) => {
  if (certifications.length === 0 && !isOwner) {
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
        <CardMembershipOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Licenses & Certifications
        </Typography>
      </Stack>

      {certifications.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No certifications added yet.
        </Typography>
      ) : (
        <Stack spacing={2.5} divider={<Divider />}>
          {certifications.map((cert, idx) => (
            <Box key={cert.id || idx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {cert.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {cert.issuingOrganization}
              </Typography>
              {(cert.issueDate || cert.expirationDate || cert.credentialId) && (
                <Typography variant="caption" color="text.secondary">
                  {[
                    cert.issueDate && `Issued: ${cert.issueDate}`,
                    cert.expirationDate && `Expires: ${cert.expirationDate}`,
                    cert.credentialId && `ID: ${cert.credentialId}`,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Typography>
              )}
              {cert.credentialUrl && (
                <MuiLink
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.75,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
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
