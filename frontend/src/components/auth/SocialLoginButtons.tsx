'use client';

import React from 'react';
import { Box, Button, Divider, Stack, Typography, Tooltip } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

export const SocialLoginButtons: React.FC = () => {
  return (
    <Box sx={{ my: 3 }}>
      <Divider sx={{ mb: 2.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 500 }}>
          OR CONTINUE WITH
        </Typography>
      </Divider>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Tooltip title="Google Single Sign-On coming soon in enterprise release" arrow>
          <span>
            <Button
              variant="outlined"
              fullWidth
              disabled
              startIcon={<GoogleIcon sx={{ color: '#ea4335' }} />}
              sx={{
                py: 1.2,
                borderRadius: '10px',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Google
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="LinkedIn OAuth 2.0 Integration coming soon in enterprise release" arrow>
          <span>
            <Button
              variant="outlined"
              fullWidth
              disabled
              startIcon={<LinkedInIcon sx={{ color: '#0a66c2' }} />}
              sx={{
                py: 1.2,
                borderRadius: '10px',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              LinkedIn
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default SocialLoginButtons;
