import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import {
  PRIMARY_NAV_ITEMS,
  PUBLIC_NAV_ITEMS,
  USER_MENU_ITEMS,
} from '../shared/navigation';
import { AppContainer } from '../components/shell/AppContainer';
import { AuthProvider } from '../context/AuthContext';

const theme = getTheme('light');

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider>{ui}</AuthProvider>
    </ThemeProvider>
  );
};

describe('Navigation System & App Shell (Prompt 14/50)', () => {
  it('validates primary navigation items have valid non-empty routes', () => {
    expect(PRIMARY_NAV_ITEMS.length).toBeGreaterThanOrEqual(4);
    PRIMARY_NAV_ITEMS.forEach((item) => {
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\/[a-zA-Z0-9_\-\/]*$/);
      expect(item.href).not.toBe('#');
    });
  });

  it('validates public navigation items have valid routes', () => {
    expect(PUBLIC_NAV_ITEMS.length).toBeGreaterThanOrEqual(3);
    PUBLIC_NAV_ITEMS.forEach((item) => {
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\/[a-zA-Z0-9_\-\/]*$/);
    });
  });

  /*
   * The role-based navigation assertions that were here are gone with the
   * navigation they described. They checked that RECRUITER_NAV_ITEMS carried
   * roles: ['recruiter'] and ADMIN_NAV_ITEMS roles: ['platform_admin'] - a test
   * that the dead vocabulary stayed dead, on two arrays nothing rendered.
   * Navigation follows the workspace now, and workspace-nav.test.tsx asserts
   * that instead.
   */

  it('validates user menu dropdown routes', () => {
    expect(USER_MENU_ITEMS.length).toBeGreaterThanOrEqual(4);
    USER_MENU_ITEMS.forEach((item) => {
      expect(item.href).toMatch(/^\/[a-zA-Z0-9_\-\/]*$/);
    });
  });

  it('renders AppContainer with standard and narrow constraints', () => {
    const { container: standardContainer } = renderWithProviders(
      <AppContainer maxWidth="standard">
        <div>Standard Content</div>
      </AppContainer>
    );
    expect(screen.getByText('Standard Content')).toBeDefined();

    const { container: narrowContainer } = renderWithProviders(
      <AppContainer maxWidth="narrow">
        <div>Narrow Content</div>
      </AppContainer>
    );
    expect(screen.getByText('Narrow Content')).toBeDefined();
  });

});
