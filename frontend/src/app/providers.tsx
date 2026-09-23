'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getTheme, springs } from '../theme/theme';
import { AuthProvider } from '../features/auth/context/authContext';

import { ErrorBoundary } from '../shared/monitoring/error_boundary';

type ColorModeContextType = {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
  setColorMode: (mode: 'light' | 'dark') => void;
};

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export default function Providers({ children, initialMode }: { children: React.ReactNode; initialMode: 'light' | 'dark' }) {
  const [mode, setMode] = useState(initialMode);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));


  const setColorMode = (nextMode: 'light' | 'dark') => {
    setMode(nextMode);
    // The server needs the same preference before streaming themed content.
    document.cookie = `kirmya-theme-mode=${nextMode}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  };

  const toggleColorMode = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setColorMode(nextMode);
  };

  // createTheme is expensive and its result is an identity that MUI and Emotion
  // key their style generation on. Rebuilding it on every render meant a theme
  // toggle regenerated the entire stylesheet, stalling the main thread long
  // enough that the switch could not paint intermediate frames.
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ErrorBoundary>
      <ColorModeContext.Provider value={{ mode, toggleColorMode, setColorMode }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {/*
              Framer Motion animates inline styles from JS, so the CSS
              prefers-reduced-motion block in the theme cannot reach it.
              reducedMotion="user" makes every spring here drop its transform and
              layout animation when the OS asks, while keeping opacity — the
              cross-fade the guidance calls for, rather than no feedback at all.
            */}
            <MotionConfig reducedMotion="user" transition={springs.entrance}>
              <AuthProvider>
                {children}
              </AuthProvider>
            </MotionConfig>
          </ThemeProvider>
        </QueryClientProvider>
      </ColorModeContext.Provider>
    </ErrorBoundary>
  );
}
