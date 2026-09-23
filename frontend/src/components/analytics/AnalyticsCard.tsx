'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function AnalyticsCard({ title, value, change, isPositive = true, subtitle, icon }: AnalyticsCardProps) {
  return (
    <Card
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {title}
          </Typography>
          {icon && <Box sx={{ color: "primary.main" }}>{icon}</Box>}
        </Box>

        <Typography variant="h4" fontWeight="bold" sx={{ color: "text.primary", mb: 1 }}>
          {value}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {change && (
            <Chip
              icon={isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
              label={change}
              size="small"
              sx={{
                bgcolor: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: isPositive ? '#10b981' : '#f43f5e',
                fontWeight: 'bold',
                fontSize: 12,
              }}
            />
          )}
          {subtitle && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
