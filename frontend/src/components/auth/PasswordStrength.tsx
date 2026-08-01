'use client';

import React from 'react';
import { Box, Typography, LinearProgress, Stack, Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthProps> = ({ password }) => {
  const hasLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+=\[\]{}|;:',.<>?/~\-]/.test(password);

  const passedCount = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let score = (passedCount / 5) * 100;
  if (password.length > 0 && password.length < 8) {
    score = Math.min(score, 20);
  }

  // 5 exact states: Very Weak, Weak, Medium, Strong, Excellent
  let color: 'error' | 'warning' | 'info' | 'success' = 'error';
  let label = 'Very Weak';

  if (passedCount === 5 && password.length >= 16) {
    color = 'success';
    label = 'Excellent';
  } else if (passedCount === 5) {
    color = 'success';
    label = 'Strong';
  } else if (passedCount >= 4) {
    color = 'info';
    label = 'Medium';
  } else if (passedCount >= 2) {
    color = 'warning';
    label = 'Weak';
  } else if (password.length > 0) {
    color = 'error';
    label = 'Very Weak';
  }

  const suggestions: string[] = [];
  if (!hasLength) suggestions.push('Use at least 12 characters');
  if (!hasUpper) suggestions.push('Add an uppercase letter (A-Z)');
  if (!hasLower) suggestions.push('Add a lowercase letter (a-z)');
  if (!hasNumber) suggestions.push('Include a number (0-9)');
  if (!hasSpecial) suggestions.push('Add a special character (@, #, !, etc.)');

  if (!password) return null;

  return (
    <Box sx={{ mt: 1.5, mb: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Password Strength:
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip label={label} size="small" color={color} variant="outlined" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }} />
          {suggestions.length > 0 && (
            <Tooltip title={`Suggestions: ${suggestions.join(' • ')}`} placement="top" arrow>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'pointer' }} />
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={score}
        color={color}
        sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
      />

      <Stack spacing={0.5}>
        <RuleItem label="✓ 12 characters" valid={hasLength} />
        <RuleItem label="✓ Uppercase letter" valid={hasUpper} />
        <RuleItem label="✓ Lowercase letter" valid={hasLower} />
        <RuleItem label="✓ Number" valid={hasNumber} />
        <RuleItem label="✓ Special character" valid={hasSpecial} />
      </Stack>
    </Box>
  );
};

const RuleItem: React.FC<{ label: string; valid: boolean }> = ({ label, valid }) => (
  <Stack direction="row" alignItems="center" spacing={0.8}>
    {valid ? (
      <CheckCircleIcon color="success" sx={{ fontSize: 14 }} />
    ) : (
      <CancelIcon color="disabled" sx={{ fontSize: 14 }} />
    )}
    <Typography
      variant="caption"
      sx={{
        color: valid ? 'success.main' : 'text.secondary',
        fontSize: '0.75rem',
        fontWeight: valid ? 600 : 400,
      }}
    >
      {label}
    </Typography>
  </Stack>
);

export default PasswordStrengthIndicator;
