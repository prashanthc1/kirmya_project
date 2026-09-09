import React from 'react';
import AppShell from '../../components/shell/AppShell';

/**
 * Settings section shell.
 *
 * Every page beneath this directory gets the application's navigation from
 * here rather than mounting its own. Context navigation is resolved from the
 * pathname by AppShell, so a new page under this section is navigable the
 * moment it exists.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="standard" maxWidth="standard">{children}</AppShell>;
}
