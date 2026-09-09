import React from 'react';
import AppShell from '../../components/shell/AppShell';

/**
 * Saved jobs section shell.
 *
 * Every page beneath this directory gets the application's navigation from
 * here rather than mounting its own. Context navigation is resolved from the
 * pathname by AppShell, so a new page under this section is navigable the
 * moment it exists.
 */
export default function SavedJobsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="standard">{children}</AppShell>;
}
