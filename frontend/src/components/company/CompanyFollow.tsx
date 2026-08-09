'use client';

/**
 * Follow / unfollow control for a company.
 *
 * Following drives the update feed and job alerts through the existing
 * notification module, so this component owns no preference storage of its own.
 */
import React from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import { useFollowCompany } from '../../features/company/hooks';

interface CompanyFollowProps {
  /** The identifier the page was loaded with, so the right cache entry clears. */
  identifier: string;
  companyId: string;
  isFollowing: boolean;
  /** Anonymous visitors are sent to sign in rather than shown a failing button. */
  isAuthenticated: boolean;
  onRequireSignIn?: () => void;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const CompanyFollow: React.FC<CompanyFollowProps> = ({
  identifier,
  companyId,
  isFollowing,
  isAuthenticated,
  onRequireSignIn,
  fullWidth = false,
  size = 'medium',
}) => {
  const follow = useFollowCompany(identifier, companyId);
  const [error, setError] = React.useState<string | null>(null);

  const handleClick = () => {
    if (!isAuthenticated) {
      onRequireSignIn?.();
      return;
    }
    follow.mutate(isFollowing, {
      onError: () => setError('That did not go through. Please try again.'),
    });
  };

  return (
    <>
      <Button
        variant={isFollowing ? 'outlined' : 'contained'}
        color="primary"
        size={size}
        fullWidth={fullWidth}
        onClick={handleClick}
        disabled={follow.isPending}
        aria-pressed={isFollowing}
        startIcon={
          follow.isPending ? (
            <CircularProgress size={16} color="inherit" />
          ) : isFollowing ? (
            <NotificationsActiveIcon />
          ) : (
            <NotificationsNoneIcon />
          )
        }
      >
        {isFollowing ? 'Following' : 'Follow'}
      </Button>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: '12px' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CompanyFollow;
