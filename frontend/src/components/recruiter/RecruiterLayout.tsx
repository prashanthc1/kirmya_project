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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <RecruiterSidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <RecruiterHeader />
        <Box sx={{ p: { xs: 2.5, md: 4 }, flexGrow: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default RecruiterLayout;
