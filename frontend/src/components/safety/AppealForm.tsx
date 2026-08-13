'use client';

import React, { useState } from 'react';
import { Box, Typography, Card, TextField, Button, Stack, Alert, useTheme } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

export const AppealForm: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [reason, setReason] = useState('Incorrect Flagging');
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <GavelIcon sx={{ color: '#6366f1', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Submit Enforcement Appeal
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        If your account or content was restricted by mistake, submit an appeal for human review.
      </Typography>

      {submitted ? (
        <Alert severity="success" sx={{ borderRadius: '12px' }}>
          Appeal submitted successfully. Your case has been queued for human reviewer re-evaluation.
        </Alert>
      ) : (
        <Card
          sx={{
            p: 4,
            borderRadius: '24px',
            bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Stack spacing={3}>
            <TextField
              label="Reason for Appeal"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
            />

            <TextField
              label="Detailed Explanation &amp; Verification Evidence"
              multiline
              rows={5}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide context and explain why the enforcement action should be reversed..."
              fullWidth
            />

            <Button
              variant="contained"
              disabled={!explanation}
              onClick={handleSubmit}
              sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2 }}
            >
              Submit Appeal
            </Button>
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default AppealForm;
