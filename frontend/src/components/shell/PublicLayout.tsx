'use client';

import React from 'react';
import AppShell, { AppShellProps } from './AppShell';

/**
 * Public Layout Wrapper (Prompt 14/50)
 * 
 * Used on unauthenticated, landing, marketing, and legal views.
 */
export const PublicLayout: React.FC<Omit<AppShellProps, 'showBottomNav' | 'sidebarVariant'>> = (props) => {
  return <AppShell {...props} showBottomNav={false} sidebarVariant={null} />;
};

export default PublicLayout;
