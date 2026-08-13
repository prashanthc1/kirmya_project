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
        bgcolor: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
            {title}
          </Typography>
          {icon && <Box sx={{ color: '#38bdf8' }}>{icon}</Box>}
        </Box>

        <Typography variant="h4" fontWeight="bold" sx={{ color: '#ffffff', mb: 1 }}>
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
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
