'use client';

import React from 'react';
import { Box, Typography, Card, Stack, useTheme } from '@mui/material';
import BillingDisabledBanner from './BillingDisabledBanner';
import CreditCardIcon from '@mui/icons-material/CreditCard';

export const PaymentMethods: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Payment Methods
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Manage stored credit cards and payment gateways.
      </Typography>

      <BillingDisabledBanner />

      <Card
        sx={{
          borderRadius: '24px',
          p: 4,
          textAlign: 'center',
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CreditCardIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No Payment Methods Required
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450 }}>
            Kirmya operates completely free of charge. You do not need to add a credit card or payment method.
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
};

export default PaymentMethods;
