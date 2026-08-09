/**
 * Shared harness for the component tests.
 *
 * Every test renders through a fresh QueryClient so that one test's cache never
 * answers another's request, and with retries off so a deliberate failure is
 * observed immediately rather than after three attempts.
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { getTheme } from '../theme/theme';

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

interface ProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  mode?: 'light' | 'dark';
}

export const Providers: React.FC<ProvidersProps> = ({
  children,
  queryClient,
  mode = 'light',
}) => (
  <QueryClientProvider client={queryClient ?? makeQueryClient()}>
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  </QueryClientProvider>
);

export const renderWithProviders = (
  ui: React.ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient; mode?: 'light' | 'dark' } = {}
) => {
  const { queryClient, mode, ...rest } = options;
  const client = queryClient ?? makeQueryClient();
  return {
    queryClient: client,
    ...render(ui, {
      wrapper: ({ children }) => (
        <Providers queryClient={client} mode={mode}>
          {children}
        </Providers>
      ),
      ...rest,
    }),
  };
};
