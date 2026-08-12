'use client';

import React from 'react';
import { Card, Typography, Button, Box, Chip, Stack, useTheme } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface PlanCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isCurrent?: boolean;
}

export const BillingPlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  description,
  features,
  isCurrent = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '24px',
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: isCurrent ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
      }}
    >
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{name}</Typography>
          {isCurrent && <Chip label="Active Plan" color="success" size="small" sx={{ fontWeight: 800 }} />}
        </Stack>

        <Typography variant="h4" sx={{ fontWeight: 900, my: 1, color: '#6366f1' }}>
          {price}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>

        <Stack spacing={1} sx={{ mb: 3 }}>
          {features.map((feat) => (
            <Stack key={feat} direction="row" spacing={1} alignItems="center">
              <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{feat}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Button
        variant={isCurrent ? 'contained' : 'outlined'}
        color="success"
        fullWidth
        disabled={isCurrent}
        sx={{ borderRadius: '12px', fontWeight: 800 }}
      >
        {isCurrent ? 'Current Free Plan' : 'Free Access'}
      </Button>
    </Card>
  );
};

export default BillingPlanCard;
