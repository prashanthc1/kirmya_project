'use client';

import React from 'react';
import { Box } from '@mui/material';
import RecruiterSidebar from './RecruiterSidebar';
import RecruiterHeader from './RecruiterHeader';

interface RecruiterLayoutProps {
  children: React.ReactNode;
}

export const RecruiterLayout: React.FC<RecruiterLayoutProps> = ({ children }) => {
  return (
    // Column on phones: a 280px sidebar beside content on a 390px screen left
    // the content roughly 137px wide, which wrapped headings to one word per
    // line across all 18 recruiter routes. Stacking puts the nav above the
    // content and gives the page its full width back.
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: '100dvh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <RecruiterSidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <RecruiterHeader />
        <Box sx={{ p: { xs: 2.5, md: 4 }, flexGrow: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default RecruiterLayout;
