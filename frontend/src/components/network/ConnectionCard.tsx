'use client';

import React, { useState } from 'react';
import {
  Card,
  Box,
  Avatar,
  Typography,
  Stack,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import Link from 'next/link';

import ConnectionNoteModal from './ConnectionNoteModal';
import BlockUserModal from './BlockUserModal';
import ReportUserModal from './ReportUserModal';
import { ConnectionRecommendation, Connection, networkingApi } from '../../features/networking/services/networkingApi';
import { tokens } from '../../theme/tokens';

interface ConnectionCardProps {
  connection: ConnectionRecommendation | Connection;
  onRemove?: () => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onRemove }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [notes, setNotes] = useState<string>((connection as Connection).notes?.[0]?.text || '');
  const [labels, setLabels] = useState<string[]>(((connection as Connection).labels as string[]) || []);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRemove = async () => {
    handleMenuClose();
    try {
      await networkingApi.removeConnection(connection.userId);
      if (onRemove) onRemove();
    } catch {
      // Handled
    }
  };

  const profileHref = `/profile/${encodeURIComponent(connection.username || connection.userId)}`;

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: `${tokens.radius.lg}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(0, 0, 0, 0.06)',
        },
      }}
    >
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              component={Link}
              href={profileHref}
              src={connection.avatarUrl}
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {connection.name ? connection.name[0].toUpperCase() : 'K'}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component={Link}
                href={profileHref}
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  textDecoration: 'none',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {connection.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.85rem',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {connection.headline || '1st-Degree Connection'}
              </Typography>
            </Box>
          </Stack>

          <IconButton size="small" onClick={handleMenuOpen} aria-label="Connection options">
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ my: 1 }}>
          {connection.location && (
            <Chip
              icon={<LocationOnOutlinedIcon sx={{ fontSize: 13 }} />}
              label={connection.location}
              size="small"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem' }}
            />
          )}

          {((connection as Connection).company || (connection as ConnectionRecommendation).currentCompany) && (
            <Chip
              icon={<BusinessOutlinedIcon sx={{ fontSize: 13 }} />}
              label={(connection as Connection).company || (connection as ConnectionRecommendation).currentCompany}
              size="small"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem' }}
            />
          )}

          {labels.map((lbl, idx) => (
            <Chip
              key={idx}
              label={lbl}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem' }}
            />
          ))}
        </Stack>

        {notes && (
          <Box
            sx={{
              p: 1.25,
              borderRadius: `${tokens.radius.sm}px`,
              bgcolor: 'action.hover',
              mb: 1.5,
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <NoteAltOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                &ldquo;{notes}&rdquo;
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>

      {/* Bottom Actions */}
      <Stack direction="row" spacing={1.5} sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
        <Button
          component={Link}
          href={`/messages?userId=${encodeURIComponent(connection.userId)}`}
          variant="contained"
          size="small"
          fullWidth
          startIcon={<ChatBubbleOutlineOutlinedIcon />}
          sx={{
            borderRadius: `${tokens.radius.sm}px`,
            fontWeight: 700,
            textTransform: 'none',
          }}
        >
          Message
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={() => setNoteModalOpen(true)}
          startIcon={<NoteAltOutlinedIcon />}
          sx={{
            borderRadius: `${tokens.radius.sm}px`,
            fontWeight: 600,
            textTransform: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Notes & Tags
        </Button>
      </Stack>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: `${tokens.radius.md}px`,
            minWidth: 190,
          },
        }}
      >
        <MenuItem component={Link} href={profileHref} onClick={handleMenuClose}>
          <ListItemText primary="View Public Profile" />
        </MenuItem>
        <MenuItem onClick={handleRemove}>
          <ListItemIcon>
            <PersonRemoveOutlinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Remove Connection" sx={{ color: 'error.main' }} />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
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
            handleMenuClose();
            setReportModalOpen(true);
          }}
        >
          <ListItemIcon>
            <FlagOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Report User" />
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <ConnectionNoteModal
        open={noteModalOpen}
        connectionId={connection.userId}
        connectionName={connection.name}
        initialNote={notes}
        initialLabels={labels}
        onClose={() => setNoteModalOpen(false)}
        onSave={(newNote: string, newLabels: string[]) => {
          setNotes(newNote);
          setLabels(newLabels);
        }}
      />

      <BlockUserModal
        open={blockModalOpen}
        userId={connection.userId}
        userName={connection.name}
        onClose={() => setBlockModalOpen(false)}
        onBlocked={() => {
          if (onRemove) onRemove();
        }}
      />

      <ReportUserModal
        open={reportModalOpen}
        userId={connection.userId}
        userName={connection.name}
        onClose={() => setReportModalOpen(false)}
      />
    </Card>
  );
};

export default ConnectionCard;
