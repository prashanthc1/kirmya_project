'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Avatar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Community } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';
import { tokens } from '../../theme/tokens';

interface CommunityHeaderProps {
  community: Community;
  onJoinToggle?: (isMember: boolean) => void;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({ community, onJoinToggle }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [isMember, setIsMember] = useState<boolean>(!!community.isMember);
  const [memberCount, setMemberCount] = useState<number>(community.memberCount || 0);
  const [loading, setLoading] = useState<boolean>(false);
  const [openRulesModal, setOpenRulesModal] = useState<boolean>(false);
  const [openInviteModal, setOpenInviteModal] = useState<boolean>(false);
  const [inviteUserId, setInviteUserId] = useState<string>('');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const isStaff = community.role === 'owner' || community.role === 'admin' || community.role === 'moderator';
  const isAdmin = community.role === 'owner' || community.role === 'admin';

  // Determine current tab index
  const getCurrentTab = () => {
    if (pathname.endsWith('/members')) return 1;
    if (pathname.endsWith('/events')) return 2;
    if (pathname.endsWith('/about')) return 3;
    if (pathname.endsWith('/moderation')) return 4;
    if (pathname.endsWith('/settings')) return 5;
    return 0;
  };

  const handleJoinClick = async () => {
    setLoading(true);
    try {
      if (isMember) {
        await communityApi.leaveCommunity(community.id);
        setIsMember(false);
        setMemberCount((prev) => Math.max(0, prev - 1));
        if (onJoinToggle) onJoinToggle(false);
      } else {
        const res = await communityApi.joinCommunity(community.id);
        if (res.pendingApproval) {
          setSnackbarMessage('Join request submitted for moderator review.');
        } else {
          setIsMember(true);
          setMemberCount((prev) => prev + 1);
          if (onJoinToggle) onJoinToggle(true);
        }
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteUserId) return;
    try {
      await communityApi.sendInvite(community.id, inviteUserId);
      setSnackbarMessage(`Invitation sent to user.`);
      setInviteUserId('');
      setOpenInviteModal(false);
    } catch {
      setSnackbarMessage('Failed to send invitation.');
    }
  };

  return (
    <Paper
      elevation={0}
      data-testid="community-header"
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      {/* Banner */}
      <Box
        sx={{
          height: { xs: 120, sm: 160 },
          width: '100%',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.08)',
          background: community.coverImageUrl
            ? `url(${community.coverImageUrl}) center/cover no-repeat`
            : undefined,
        }}
      />

      {/* Main Metadata */}
      <Box sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          gap={2}
          sx={{ mt: { xs: -4, sm: -5 }, mb: 2 }}
        >
          {/* Avatar & Title */}
          <Stack direction="row" spacing={2} alignItems="flex-end">
            <Avatar
              src={community.avatarUrl}
              sx={{
                width: { xs: 72, sm: 88 },
                height: { xs: 72, sm: 88 },
                border: '3px solid',
                borderColor: 'background.paper',
                bgcolor: 'primary.main',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem' },
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            >
              {community.title ? community.title[0].toUpperCase() : 'C'}
            </Avatar>

            <Box sx={{ pb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {community.title}
              </Typography>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700, mt: 0.25 }}>
                {community.category || 'Professional Group'}
              </Typography>
            </Box>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {community.rules && community.rules.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<GavelIcon fontSize="small" />}
                onClick={() => setOpenRulesModal(true)}
                sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600, textTransform: 'none' }}
              >
                Rules
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddOutlinedIcon fontSize="small" />}
                onClick={() => setOpenInviteModal(true)}
                sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600, textTransform: 'none' }}
              >
                Invite
              </Button>
            )}

            <Button
              variant={isMember ? 'outlined' : 'contained'}
              color={isMember ? 'inherit' : 'primary'}
              size="small"
              onClick={handleJoinClick}
              disabled={loading}
              startIcon={isMember ? <CheckCircleIcon fontSize="small" color="success" /> : undefined}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none', px: 2 }}
            >
              {loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : isMember ? (
                'Joined'
              ) : community.isPrivate ? (
                'Request Membership'
              ) : (
                'Join Community'
              )}
            </Button>
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 800, mb: 2, lineHeight: 1.5 }}>
          {community.description}
        </Typography>

        {/* Badges / Stats Bar */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2.5 }}>
          <Chip
            icon={community.isPrivate ? <LockIcon sx={{ fontSize: 13 }} /> : <PublicIcon sx={{ fontSize: 13 }} />}
            label={community.isPrivate ? 'Private Circle' : 'Public Community'}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem' }}
          />

          <Chip
            icon={<PeopleOutlineIcon sx={{ fontSize: 14 }} />}
            label={`${memberCount} Member${memberCount === 1 ? '' : 's'}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem' }}
          />

          {community.role && (
            <Chip
              label={`Role: ${community.role.toUpperCase()}`}
              size="small"
              color={community.role === 'owner' || community.role === 'admin' ? 'primary' : 'default'}
              sx={{ fontWeight: 700, height: 24, fontSize: '0.7rem' }}
            />
          )}
        </Stack>

        {/* Navigation Tabs */}
        <Tabs
          value={getCurrentTab()}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Community workspace navigation tabs"
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            minHeight: 44,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              minHeight: 44,
              px: 2,
            },
          }}
        >
          <Tab component={Link} href={`/communities/${community.id}`} label="Discussions" icon={<ForumOutlinedIcon fontSize="small" />} iconPosition="start" />
          <Tab component={Link} href={`/communities/${community.id}/members`} label="Members" icon={<PeopleOutlineIcon fontSize="small" />} iconPosition="start" />
          <Tab component={Link} href={`/communities/${community.id}/events`} label="Events" icon={<EventOutlinedIcon fontSize="small" />} iconPosition="start" />
          <Tab component={Link} href={`/communities/${community.id}/about`} label="About & Rules" icon={<InfoOutlinedIcon fontSize="small" />} iconPosition="start" />
          {isStaff && (
            <Tab component={Link} href={`/communities/${community.id}/moderation`} label="Moderation" icon={<SecurityOutlinedIcon fontSize="small" />} iconPosition="start" />
          )}
          {isAdmin && (
            <Tab component={Link} href={`/communities/${community.id}/settings`} label="Settings" icon={<SettingsOutlinedIcon fontSize="small" />} iconPosition="start" />
          )}
        </Tabs>
      </Box>

      {/* Community Rules Modal */}
      <Dialog open={openRulesModal} onClose={() => setOpenRulesModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Community Guidelines & Rules</DialogTitle>
        <DialogContent>
          <List>
            {community.rules?.map((rule, idx) => (
              <ListItem key={idx} alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                  <GavelIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary={rule} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenRulesModal(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Member Modal */}
      <Dialog open={openInviteModal} onClose={() => setOpenInviteModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Invite Professional</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User ID or Email"
            fullWidth
            variant="outlined"
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenInviteModal(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSendInvite} variant="contained" disabled={!inviteUserId}>Send Invite</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Paper>
  );
};

export default CommunityHeader;
