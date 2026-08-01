'use client';

import React, { useState } from 'react';
import { Button, ButtonProps } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { companiesApi } from '../../features/companies/api';

interface FollowButtonProps extends Omit<ButtonProps, 'onToggle'> {
  companyId: string;
  initialFollowing?: boolean;
  onToggleFollow?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  companyId,
  initialFollowing = false,
  onToggleFollow,
  sx,
  ...props
}) => {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (following) {
        await companiesApi.unfollowCompany(companyId);
        setFollowing(false);
        onToggleFollow?.(false);
      } else {
        await companiesApi.followCompany(companyId);
        setFollowing(true);
        onToggleFollow?.(true);
      }
    } catch {
      setFollowing(!following);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="small"
      variant={following ? 'contained' : 'outlined'}
      color={following ? 'success' : 'primary'}
      startIcon={following ? <CheckIcon /> : <AddIcon />}
      disabled={loading}
      onClick={handleClick}
      sx={{
        borderRadius: '10px',
        fontWeight: 700,
        textTransform: 'none',
        px: 2,
        ...sx,
      }}
      {...props}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;
