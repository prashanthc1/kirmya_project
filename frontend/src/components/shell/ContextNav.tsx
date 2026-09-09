'use client';

import React from 'react';
import { Box, Tabs, Tab, useTheme } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { findActiveId } from '../../shared/navigation/matchRoute';
import type { NavContext } from '../../shared/navigation/contexts';
import { tokens } from '../../theme/tokens';

export interface ContextNavProps {
  context: NavContext;
  /** Rendered at the end of the row — a Manage action, a primary button. */
  actions?: React.ReactNode;
}

/**
 * Secondary navigation for the module the viewer is in.
 *
 * One component for every context, driven by the registry, rather than a
 * bespoke header per page. Tabs are real links, so they open in a new tab,
 * work without JavaScript's click handler and are announced as navigation.
 * MUI's Tabs already give roving focus and horizontal scrolling on narrow
 * screens, which is what a phone needs here — not a shrunken desktop row.
 */
export const ContextNav: React.FC<ContextNavProps> = ({ context, actions }) => {
  const pathname = usePathname() || '/';
  const theme = useTheme();
  const activeId = findActiveId(pathname, context.items);

  if (context.items.length <= 1 && !actions) return null;

  return (
    <Box
      component="nav"
      aria-label={context.title ? `${context.title} sections` : 'Section navigation'}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.default',
        px: { xs: 1, sm: 2 },
      }}
    >
      <Tabs
        value={activeId ?? false}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label={context.title ? `${context.title} sections` : 'Section navigation'}
        sx={{
          minHeight: 48,
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            px: 2,
            borderRadius: `${tokens.radius.sm}px ${tokens.radius.sm}px 0 0`,
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2,
            },
          },
          '& .Mui-selected': { fontWeight: 700 },
        }}
      >
        {context.items.map(item => (
          <Tab
            key={item.id}
            value={item.id}
            label={item.label}
            component={Link}
            href={item.href}
            // aria-current is what a screen reader uses to say "this one".
            // The selected tab styling alone conveys it to sighted users only.
            aria-current={activeId === item.id ? 'page' : undefined}
          />
        ))}
      </Tabs>
      {actions ? <Box sx={{ display: 'flex', gap: 1, py: 1 }}>{actions}</Box> : null}
    </Box>
  );
};

export default ContextNav;
