'use client';

import React from 'react';
import AppShell, { AppShellProps } from './AppShell';

/**
 * Authenticated Layout Wrapper (Prompt 14/50)
 * 
 * Used across authenticated candidate, recruiter, company, and admin views.
 */
export const AuthenticatedLayout: React.FC<AppShellProps> = (props) => {
  return <AppShell {...props} showBottomNav={true} />;
};

export default AuthenticatedLayout;
