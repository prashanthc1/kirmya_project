'use client';

import React, { useState } from 'react';
import { Box, useTheme } from '@mui/material';
import AppHeader from './AppHeader';
import MobileDrawer from './MobileDrawer';
import MobileBottomNav from './MobileBottomNav';
import AppSidebar from './AppSidebar';
import AppContainer from './AppContainer';
import { tokens } from '../../theme/tokens';

export interface AppShellProps {
  children: React.ReactNode;
  sidebarVariant?: 'recruiter' | 'admin' | null;
  maxWidth?: 'narrow' | 'standard' | 'wide' | 'max' | false;
  disableGutters?: boolean;
  showBottomNav?: boolean;
}

/**
 * Universal Application Shell (Prompt 14/50)
 * 
 * Provides unified header navigation, mobile drawer, secondary sidebar layout,
 * page container, and bottom navigation.
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  sidebarVariant = null,
  maxWidth = 'standard',
  disableGutters = false,
  showBottomNav = true,
}) => {
  const theme = useTheme();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      {/* Top Global Navigation Bar */}
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />

      {/* Mobile Slide-Out Drawer */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Body Area with Optional Sidebar */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Secondary Console Sidebar (Admin or Recruiter) */}
        {sidebarVariant && <AppSidebar variant={sidebarVariant} />}

        {/* Primary Page Content Area */}
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            pb: showBottomNav ? { xs: 8, sm: 0 } : 0,
            outline: 'none',
          }}
        >
          <AppContainer maxWidth={maxWidth} disableGutters={disableGutters}>
            {children}
          </AppContainer>
        </Box>
      </Box>

      {/* Mobile Bottom Navigation Bar on Compact Screens */}
      {showBottomNav && <MobileBottomNav />}
    </Box>
  );
};

export default AppShell;
