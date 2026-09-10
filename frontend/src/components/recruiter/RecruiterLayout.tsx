'use client';

import React from 'react';
import { Box } from '@mui/material';
import RecruiterSidebar from './RecruiterSidebar';
import RecruiterHeader from './RecruiterHeader';
import RecruiterCapabilityGate from './RecruiterCapabilityGate';
import MobileBottomNav from '../shell/MobileBottomNav';
import { workspaceMobileItems } from '../../shared/navigation/workspaceNav';
import type { Workspace } from '../../shared/workspace/types';

/*
 * Every page under this layout is in the recruiting workspace by construction,
 * so the destinations are named directly rather than resolved from a list the
 * account may not have loaded yet. The capability gate above still decides
 * whether any of it renders, and each route enforces its own authorization.
 */
const recruitingWorkspace: Workspace = {
  key: 'recruiting',
  type: 'recruiting',
  label: 'Recruiting',
  route: '/recruiter',
  isDefault: false,
};

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
        {/*
          Bottom padding matches the shell's, so the fixed bar below does not
          sit on top of the last row of content on a phone.
        */}
        <Box sx={{ p: { xs: 2.5, md: 4 }, pb: { xs: 8, md: 4 }, flexGrow: 1 }}>
          <RecruiterCapabilityGate>{children}</RecruiterCapabilityGate>
        </Box>
      </Box>

      {/*
        The bottom bar this workspace never had.
        /recruiter/* is the one workspace outside the global shell, so it got no
        bottom navigation at all: on a phone the seventeen-item sidebar stacked
        above the content was the only way between screens. These are the
        recruiting destinations, which is what the bar is for - the primary
        destinations of the workspace you are actually in.
      */}
      <MobileBottomNav items={workspaceMobileItems(recruitingWorkspace)} />
    </Box>
  );
};

export default RecruiterLayout;
