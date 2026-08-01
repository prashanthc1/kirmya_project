'use client';

import React from 'react';
import { Box, FormControlLabel, Checkbox, Typography, Link as MuiLink, Stack } from '@mui/material';

interface TermsAgreementProps {
  acceptTerms: boolean;
  onAcceptTermsChange: (checked: boolean) => void;
  acceptTermsError?: string;
  subscribeCareerUpdates?: boolean;
  onSubscribeCareerUpdatesChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const TermsAgreement: React.FC<TermsAgreementProps> = ({
  acceptTerms,
  onAcceptTermsChange,
  acceptTermsError,
  subscribeCareerUpdates = true,
  onSubscribeCareerUpdatesChange,
  disabled,
}) => {
  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={acceptTerms}
            onChange={(e) => onAcceptTermsChange(e.target.checked)}
            color="primary"
            size="small"
            disabled={disabled}
          />
        }
        label={
          <Typography variant="body2">
            I agree to Kirmya{' '}
            <MuiLink href="/terms" underline="hover" color="primary.main" target="_blank">
              Terms of Service
            </MuiLink>{' '}
            and{' '}
            <MuiLink href="/privacy" underline="hover" color="primary.main" target="_blank">
              Privacy Policy
            </MuiLink>
          </Typography>
        }
      />
      {acceptTermsError && (
        <Typography variant="caption" color="error" sx={{ ml: 3.5, display: 'block' }}>
          {acceptTermsError}
        </Typography>
      )}

      {onSubscribeCareerUpdatesChange && (
        <FormControlLabel
          control={
            <Checkbox
              checked={subscribeCareerUpdates}
              onChange={(e) => onSubscribeCareerUpdatesChange(e.target.checked)}
              color="primary"
              size="small"
              disabled={disabled}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Subscribe to Career Update Emails & AI Opportunity Alerts
            </Typography>
          }
        />
      )}
    </Stack>
  );
};

export default TermsAgreement;
