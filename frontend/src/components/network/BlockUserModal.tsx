'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Stack,
} from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { tokens } from '../../theme/tokens';
import { networkingApi } from '../../features/networking/services/networkingApi';

interface BlockUserModalProps {
  open: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
  onBlocked?: () => void;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
  open,
  userId,
  userName,
  onClose,
  onBlocked,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirmBlock = async () => {
    setLoading(true);
    try {
      await networkingApi.blockUser(userId);
      onClose();
      if (onBlocked) onBlocked();
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: `${tokens.radius.lg}px`,
          p: 1.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.01em', pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <BlockOutlinedIcon color="error" />
          <span>Block {userName}?</span>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Blocking <strong>{userName}</strong> will immediately remove any 1st-degree connection, prevent future messaging, and remove each other from search results and suggestions.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmBlock}
          variant="contained"
          color="error"
          disabled={loading}
          sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Block User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlockUserModal;
