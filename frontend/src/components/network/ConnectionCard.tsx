'use client';

import React, { useState } from 'react';
import {
  Card,
  Box,
  Avatar,
  Typography,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import BlockIcon from '@mui/icons-material/Block';
import FlagIcon from '@mui/icons-material/Flag';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';
import ConnectionNoteModal from './ConnectionNoteModal';
import { ConnectionRecommendation, Connection, networkingApi } from '../../features/networking/services/networkingApi';

interface ConnectionCardProps {
  connection: ConnectionRecommendation | Connection;
  onRemove?: () => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onRemove }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [notes, setNotes] = useState<string>((connection as Connection).notes?.[0]?.text || '');
  const [labels, setLabels] = useState<string[]>((connection as Connection).labels as string[] || []);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRemove = async () => {
    handleMenuClose();
    if (confirm(`Remove 1st-degree connection with ${connection.name}?`)) {
      try {
        await networkingApi.removeConnection(connection.userId);
        if (onRemove) onRemove();
      } catch {
        alert('Failed to remove connection.');
      }
    }
  };

  const handleBlock = async () => {
    handleMenuClose();
    if (confirm(`Block ${connection.name}? You will no longer be able to message or view each other.`)) {
      try {
        await networkingApi.blockUser(connection.userId);
        if (onRemove) onRemove();
      } catch {
        alert('Failed to block user.');
      }
    }
  };

  const handleSendReport = async () => {
    if (!reportReason) return;
    try {
      await networkingApi.reportUser(connection.userId, reportReason, reportDetails);
      alert('Report submitted to network moderation team.');
      setReportModalOpen(false);
      setReportReason('');
      setReportDetails('');
    } catch {
      alert('Failed to send report.');
    }
  };

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '20px',
        backdropFilter: 'blur(12px)',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          borderColor: 'primary.main',
        },
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
          <Avatar
            src={connection.avatarUrl}
            sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800, fontSize: '1.25rem' }}
          >
            {connection.name ? connection.name[0].toUpperCase() : 'K'}
          </Avatar>

          <Box>
            <Typography
              component={Link}
              href={`/profile/${connection.username || connection.userId}`}
              variant="subtitle1"
              sx={{ fontWeight: 800, textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
            >
              {connection.name || connection.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {connection.headline || 'Professional Member'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {connection.location} {connection.industry ? `• ${connection.industry}` : ''}
            </Typography>

            {labels && labels.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap">
                {labels.map((lbl) => (
                  <Chip key={lbl} label={lbl} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                ))}
              </Stack>
            )}

            {notes && (
              <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                Note: &quot;{notes.slice(0, 60)}{notes.length > 60 ? '...' : ''}&quot;
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
          <Tooltip title="Private Note & Labels">
            <IconButton color={notes ? 'primary' : 'default'} onClick={() => setNoteModalOpen(true)}>
              <NoteAltIcon />
            </IconButton>
          </Tooltip>

          <Button
            component={Link}
            href={`/messaging?user=${connection.userId}`}
            variant="outlined"
            startIcon={<MessageIcon />}
            size="small"
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Message
          </Button>

          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { borderRadius: '16px', minWidth: 180 } }}>
        <MenuItem component={Link} href={`/profile/${connection.username || connection.userId}`} onClick={handleMenuClose}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View Profile" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>

        <MenuItem onClick={() => { handleMenuClose(); setNoteModalOpen(true); }}>
          <ListItemIcon><NoteAltIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit Private Note" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>

        <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
          <ListItemIcon><PersonRemoveIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Remove Connection" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>

        <MenuItem onClick={handleBlock} sx={{ color: 'error.main' }}>
          <ListItemIcon><BlockIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Block Member" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>

        <MenuItem onClick={() => { handleMenuClose(); setReportModalOpen(true); }} sx={{ color: 'warning.main' }}>
          <ListItemIcon><FlagIcon fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText primary="Report User" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
      </Menu>

      <ConnectionNoteModal
        open={noteModalOpen}
        connectionId={connection.userId}
        connectionName={connection.name}
        initialNote={notes}
        initialLabels={labels}
        onClose={() => setNoteModalOpen(false)}
        onSave={(newNote, newLabels) => {
          setNotes(newNote);
          setLabels(newLabels);
        }}
      />

      <Dialog open={reportModalOpen} onClose={() => setReportModalOpen(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Report {connection.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please specify why you are reporting this user.
          </Typography>
          <TextField
            fullWidth
            label="Reason"
            placeholder="Ex: Harassment, Spam, Inappropriate behavior"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Details (Optional)"
            placeholder="Provide additional details for moderation team..."
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReportModalOpen(false)} variant="outlined" sx={{ borderRadius: '12px', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button onClick={handleSendReport} variant="contained" color="warning" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ConnectionCard;
