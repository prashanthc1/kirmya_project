'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export const AudioVisualizer: React.FC = () => {
  return (
    <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center" sx={{ py: 1 }}>
      {[0.4, 0.8, 1.2, 0.6, 1.4, 0.9, 0.5, 1.1, 0.7].map((delay, idx) => (
        <Box
          key={idx}
          sx={{
            width: 4,
            height: 24,
            borderRadius: 2,
            bgcolor: '#34D399',
            animation: `pulse 1.2s infinite ease-in-out ${delay}s`,
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scaleY(0.3)', opacity: 0.5 },
              '50%': { transform: 'scaleY(1.2)', opacity: 1 },
            },
          }}
        />
      ))}
      <Typography variant="caption" fontWeight={600} sx={{ color: '#34D399', ml: 1.5 }}>
        Listening to candidate response...
      </Typography>
    </Stack>
  );
};
