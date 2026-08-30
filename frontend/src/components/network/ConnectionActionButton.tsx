'use client';

import React, { useState } from 'react';
import {
  Button,
  Stack,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import Link from 'next/link';

import ConnectionRequestDialog from './ConnectionRequestDialog';
import BlockUserModal from './BlockUserModal';
import ReportUserModal from './ReportUserModal';
import { tokens } from '../../theme/tokens';
import { networkingApi } from '../../features/networking/services/networkingApi';

export type RelationshipStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'connected'
  | 'blocked'
  | string;

interface ConnectionActionButtonProps {
  userId: string;
  userName: string;
  userUsername?: string;
  initialStatus?: RelationshipStatus;
  requestId?: string;
  size?: 'small' | 'medium';
  onStatusChange?: (newStatus: RelationshipStatus) => void;
  onOpenNote?: () => void;
}

export const ConnectionActionButton: React.FC<ConnectionActionButtonProps> = ({
  userId,
  userName,
  userUsername,
  initialStatus = 'none',
  requestId,
  size = 'medium',
  onStatusChange,
  onOpenNote,
}) => {
  const [status, setStatus] = useState<RelationshipStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const updateStatus = (newStatus: RelationshipStatus) => {
    setStatus(newStatus);
    if (onStatusChange) onStatusChange(newStatus);
  };

  const handleSendRequest = async (note?: string) => {
    setLoading(true);
    try {
      await networkingApi.sendRequest(userId, note);
      updateStatus('pending_sent');
    } catch {
      // rollback or alert handled
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      await networkingApi.acceptRequest(requestId);
      updateStatus('connected');
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      await networkingApi.declineRequest(requestId);
      updateStatus('none');
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      if (requestId) {
        await networkingApi.withdrawRequest(requestId);
      }
      updateStatus('none');
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    setAnchorEl(null);
    setLoading(true);
    try {
      await networkingApi.removeConnection(userId);
      updateStatus('none');
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      await networkingApi.unblockUser(userId);
      updateStatus('none');
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {status === 'none' && (
        <Button
          variant="contained"
          size={size}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PersonAddOutlinedIcon />}
          onClick={() => setConnectDialogOpen(true)}
          disabled={loading}
          sx={{
            borderRadius: `${tokens.radius.sm}px`,
            fontWeight: 700,
            textTransform: 'none',
          }}
          aria-label={`Connect with ${userName}`}
        >
          Connect
        </Button>
      )}

      {status === 'pending_sent' && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            variant="outlined"
            size={size}
            startIcon={<HourglassEmptyOutlinedIcon />}
            disabled
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              fontWeight: 600,
              textTransform: 'none',
            }}
            aria-label={`Connection request pending with ${userName}`}
          >
            Pending
          </Button>
          <IconButton
            size="small"
            title="Withdraw invitation"
            onClick={handleWithdraw}
            disabled={loading}
            aria-label={`Withdraw connection request to ${userName}`}
          >
            <UndoOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}

      {status === 'pending_received' && (
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size={size}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <CheckOutlinedIcon />}
            onClick={handleAccept}
            disabled={loading}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              fontWeight: 700,
              textTransform: 'none',
            }}
            aria-label={`Accept connection from ${userName}`}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            size={size}
            startIcon={<CloseOutlinedIcon />}
            onClick={handleDecline}
            disabled={loading}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              fontWeight: 600,
              textTransform: 'none',
            }}
            aria-label={`Decline connection from ${userName}`}
          >
            Decline
          </Button>
        </Stack>
      )}

      {status === 'connected' && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            component={Link}
            href={`/messages?userId=${encodeURIComponent(userId)}`}
            variant="outlined"
            size={size}
            startIcon={<ChatBubbleOutlineOutlinedIcon />}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              fontWeight: 600,
              textTransform: 'none',
            }}
            aria-label={`Message ${userName}`}
          >
            Message
          </Button>

          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label={`More options for ${userName}`}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: `${tokens.radius.md}px`,
                minWidth: 180,
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 8px 24px rgba(0,0,0,0.5)'
                    : '0 8px 24px rgba(0,0,0,0.1)',
              },
            }}
          >
            {onOpenNote && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  onOpenNote();
                }}
              >
                <ListItemText primary="Private Note & Tags" />
              </MenuItem>
            )}
            <MenuItem onClick={handleRemoveConnection}>
              <ListItemIcon>
                <PersonRemoveOutlinedIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Remove Connection" sx={{ color: 'error.main' }} />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setBlockModalOpen(true);
              }}
            >
              <ListItemIcon>
                <BlockOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Block User" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setReportModalOpen(true);
              }}
            >
              <ListItemIcon>
                <FlagOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Report User" />
            </MenuItem>
          </Menu>
        </Stack>
      )}

      {status === 'blocked' && (
        <Button
          variant="outlined"
          color="error"
          size={size}
          onClick={handleUnblock}
          disabled={loading}
          sx={{
            borderRadius: `${tokens.radius.sm}px`,
            fontWeight: 600,
            textTransform: 'none',
          }}
          aria-label={`Unblock ${userName}`}
        >
          Unblock
        </Button>
      )}

      {/* Modals */}
      <ConnectionRequestDialog
        open={connectDialogOpen}
        targetName={userName}
        onClose={() => setConnectDialogOpen(false)}
        onSubmit={handleSendRequest}
      />

      <BlockUserModal
        open={blockModalOpen}
        userId={userId}
        userName={userName}
        onClose={() => setBlockModalOpen(false)}
        onBlocked={() => updateStatus('blocked')}
      />

      <ReportUserModal
        open={reportModalOpen}
        userId={userId}
        userName={userName}
        onClose={() => setReportModalOpen(false)}
      />
    </>
  );
};

export default ConnectionActionButton;
