'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import BlockedUsers from './BlockedUsers';

export const BlockList: React.FC = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <BlockIcon sx={{ color: 'warning.main', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Blocked Accounts Manager
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Blocked users, recruiters, and companies cannot send direct messages, connection requests, or view your profile updates.
      </Typography>

      <BlockedUsers />
    </Box>
  );
};

export default BlockList;
