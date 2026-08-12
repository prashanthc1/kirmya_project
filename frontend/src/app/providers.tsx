'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getTheme } from '../theme/theme';
import { AuthProvider } from '../features/auth/context/authContext';

type ColorModeContextType = {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    const savedMode = localStorage.getItem('kirmya-theme-mode') as 'light' | 'dark';
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  const toggleColorMode = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    localStorage.setItem('kirmya-theme-mode', nextMode);
  };

  // createTheme is expensive and its result is an identity that MUI and Emotion
  // key their style generation on. Rebuilding it on every render meant a theme
  // toggle regenerated the entire stylesheet, stalling the main thread long
  // enough that the switch could not paint intermediate frames.
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
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
          <MotionConfig reducedMotion="user">
            <AuthProvider>
              {children}
            </AuthProvider>
          </MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </ColorModeContext.Provider>
  );
}
