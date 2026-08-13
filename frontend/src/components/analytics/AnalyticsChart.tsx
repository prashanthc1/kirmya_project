'use client';

import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface DataPoint {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  color?: string;
}

export default function AnalyticsChart({ title, subtitle, data, color = '#38bdf8' }: AnalyticsChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card
      sx={{
        bgcolor: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 180, pt: 2, pb: 1, borderBottom: '1px solid #334155' }}>
          {data.map((item, idx) => {
            const heightPercent = (item.value / maxVal) * 100;
            return (
              <Box key={idx} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 'bold', mb: 0.5 }}>
                  {item.value}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 36,
                    height: `${heightPercent}%`,
                    bgcolor: color,
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, fontSize: 11 }}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
