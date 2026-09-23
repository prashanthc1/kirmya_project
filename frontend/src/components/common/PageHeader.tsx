'use client';

import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
}) => {
  return (
    <Box sx={{ mb: { xs: 3, sm: 4 }, minWidth: 0 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 1.5 }}
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (isLast || !item.href) {
              return (
                <Typography key={index} variant="body2" color="text.primary" fontWeight={600} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </Typography>
              );
            }
            return (
              <MuiLink
                key={index}
                component={Link}
                href={item.href}
                variant="body2"
                color="text.secondary"
                underline="hover"
                sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}
              >
                {item.label}
              </MuiLink>
            );
          })}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" fontWeight={700} letterSpacing="-0.025em" sx={{ lineHeight: 1.15, overflowWrap: 'anywhere' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: '65ch', lineHeight: 1.6 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, maxWidth: '100%' }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
