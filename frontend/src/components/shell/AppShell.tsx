'use client';

import React, { createContext, useContext, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { usePathname } from 'next/navigation';
import AppHeader from './AppHeader';
import MobileDrawer from './MobileDrawer';
import MobileBottomNav from './MobileBottomNav';
import AppSidebar from './AppSidebar';
import AppContainer from './AppContainer';
import ContextNav from './ContextNav';
import { resolveContext, type NavContext } from '../../shared/navigation/contexts';

/**
 * How much navigation a screen gets.
 *
 * `standard` is the professional app: global navigation, the module's context
 * tabs, mobile bottom bar. `compact` keeps the global bar but drops the context
 * row and the bottom bar, for a screen that is itself a workspace — Messages
 * has three panes and every row of chrome costs it. `focused` is for a task the
 * viewer is meant to finish: entity management, settings, profile editing. One
 * identical navbar on every page was never the goal; a predictable set of three
 * is.
 */
export type ShellVariant = 'standard' | 'compact' | 'focused';

/**
 * Marks that a shell is already mounted above.
 *
 * Section layouts wrap every page beneath them, and 52 pages had already
 * mounted their own AppShell before those layouts existed. Nesting one inside
 * the other would render two headers, two bottom bars and two <main> elements -
 * the second of which would be announced as a second main landmark. Instead the
 * inner one steps aside and renders its children, so a page keeps working
 * whether or not it was ever migrated.
 */
const ShellMountedContext = createContext(false);

/** Whether a page is already inside an application shell. */
export const useInsideAppShell = (): boolean => useContext(ShellMountedContext);

export interface AppShellProps {
  children: React.ReactNode;
  sidebarVariant?: 'recruiter' | 'admin' | null;
  maxWidth?: 'narrow' | 'standard' | 'wide' | 'max' | false;
  disableGutters?: boolean;
  showBottomNav?: boolean;
  variant?: ShellVariant;
  /**
   * Context navigation. Omit to resolve it from the pathname, pass one to
   * override, pass null to suppress it on a screen that supplies its own.
   */
  context?: NavContext | null;
  /** Rendered at the end of the context row — typically a Manage action. */
  contextActions?: React.ReactNode;
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
  variant = 'standard',
  context,
  contextActions,
}) => {
  const theme = useTheme();
  const pathname = usePathname() || '/';
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Resolved from the path unless the caller decided. Doing it here is why a
  // page does not have to know its own navigation.
  const alreadyMounted = useContext(ShellMountedContext);
  const resolved = context === undefined ? resolveContext(pathname) : context;
  const showContext = variant === 'standard' && resolved !== null;
  const showBottom = showBottomNav && variant !== 'compact';

  // Hooks above run unconditionally; only the output is skipped.
  if (alreadyMounted) return <>{children}</>;

  return (
    <ShellMountedContext.Provider value>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
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

      {/* Secondary Navigation For The Current Module */}
      {showContext && resolved ? (
        <ContextNav context={resolved} actions={contextActions} />
      ) : null}

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
            pb: showBottom ? { xs: 8, sm: 0 } : 0,
            outline: 'none',
          }}
        >
          <AppContainer maxWidth={maxWidth} disableGutters={disableGutters}>
            {children}
          </AppContainer>
        </Box>
      </Box>

      {/* Mobile Bottom Navigation Bar on Compact Screens */}
      {showBottom && <MobileBottomNav />}
    </Box>
    </ShellMountedContext.Provider>
  );
};

export default AppShell;
