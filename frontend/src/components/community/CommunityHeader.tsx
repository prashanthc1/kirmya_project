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
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import EventIcon from '@mui/icons-material/Event';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Community } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';

interface CommunityHeaderProps {
  community: Community;
  onJoinToggle?: (isMember: boolean) => void;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({ community, onJoinToggle }) => {
  const pathname = usePathname();
  const [isMember, setIsMember] = useState<boolean>(!!community.isMember);
  const [memberCount, setMemberCount] = useState<number>(community.memberCount);
  const [openRulesModal, setOpenRulesModal] = useState<boolean>(false);
  const [openInviteModal, setOpenInviteModal] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const isStaff = community.role === 'owner' || community.role === 'admin' || community.role === 'moderator';
  const isAdmin = community.role === 'owner' || community.role === 'admin';

  // Determine current tab index from pathname
  const getCurrentTab = () => {
    if (pathname.endsWith('/members')) return 1;
    if (pathname.endsWith('/events')) return 2;
    if (pathname.endsWith('/about')) return 3;
    if (pathname.endsWith('/moderation')) return 4;
    if (pathname.endsWith('/settings')) return 5;
    return 0;
  };

  const handleJoinClick = async () => {
    if (isMember) {
      await communityApi.leaveCommunity(community.id);
      setIsMember(false);
      setMemberCount((prev) => Math.max(0, prev - 1));
      if (onJoinToggle) onJoinToggle(false);
    } else {
      const res = await communityApi.joinCommunity(community.id);
      if (res.pendingApproval) {
        setSnackbarMessage('Join request submitted for admin review.');
      } else {
        setIsMember(true);
        setMemberCount((prev) => prev + 1);
        if (onJoinToggle) onJoinToggle(true);
      }
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) return;
    await communityApi.sendInvite(community.id, inviteEmail, inviteRole);
    setSnackbarMessage(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setOpenInviteModal(false);
  };

  return (
    <Paper
      data-testid="community-header"
      elevation={0}
      sx={{
        borderRadius: '24px',
        overflow: 'hidden',
        mb: 4,
        background: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(99, 102, 241, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Banner Cover Image */}
      <Box
        sx={{
          height: { xs: 140, md: 220 },
          width: '100%',
          position: 'relative',
          background: community.coverImageUrl
            ? `url(${community.coverImageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 1,
          }}
        >
          <Chip
            icon={community.isPrivate ? <LockIcon sx={{ fontSize: 16 }} /> : <PublicIcon sx={{ fontSize: 16 }} />}
            label={community.isPrivate ? 'Private Community' : 'Public Community'}
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.7)',
              color: '#ffffff',
              backdropFilter: 'blur(10px)',
              fontWeight: 700,
            }}
          />
          <Chip
            label={community.category}
            color="primary"
            sx={{ fontWeight: 700, backdropFilter: 'blur(10px)' }}
          />
        </Box>
      </Box>

      {/* Profile Bar */}
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            mt: { xs: -5, md: -6 },
            mb: 3,
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5 }}>
            <Avatar
              src={community.avatarUrl}
              alt={community.title}
              sx={{
                width: { xs: 90, md: 120 },
                height: { xs: 90, md: 120 },
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
                fontWeight: 800,
              }}
            >
              {community.title.charAt(0)}
            </Avatar>
            <Box sx={{ pb: 0.5 }}>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                {community.title}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={700} color="text.secondary">
                    {memberCount.toLocaleString()} Members
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <ForumIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={700} color="text.secondary">
                    {community.postCount.toLocaleString()} Posts
                  </Typography>
                </Stack>
                {community.role && (
                  <Chip
                    label={`Role: ${community.role}`}
                    size="small"
                    color="secondary"
                    sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                  />
                )}
              </Stack>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ alignSelf: { xs: 'stretch', md: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<GavelIcon />}
              onClick={() => setOpenRulesModal(true)}
              sx={{ borderRadius: '12px', fontWeight: 700 }}
            >
              Rules
            </Button>
            {isMember && (
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenInviteModal(true)}
                sx={{ borderRadius: '12px', fontWeight: 700 }}
              >
                Invite
              </Button>
            )}
            <Button
              variant={isMember ? 'outlined' : 'contained'}
              color={isMember ? 'success' : 'primary'}
              onClick={handleJoinClick}
              startIcon={isMember ? <CheckCircleIcon /> : undefined}
              sx={{ borderRadius: '12px', fontWeight: 700, px: 3 }}
            >
              {isMember ? 'Joined' : community.isPrivate ? 'Request to Join' : 'Join Group'}
            </Button>
          </Stack>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={getCurrentTab()}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                minHeight: 48,
              },
            }}
          >
            <Tab icon={<ForumIcon />} iconPosition="start" label="Feed" component={Link} href={`/communities/${community.id}`} />
            <Tab icon={<PeopleIcon />} iconPosition="start" label="Members" component={Link} href={`/communities/${community.id}/members`} />
            <Tab icon={<EventIcon />} iconPosition="start" label="Events" component={Link} href={`/communities/${community.id}/events`} />
            <Tab icon={<InfoIcon />} iconPosition="start" label="About" component={Link} href={`/communities/${community.id}/about`} />
            {isStaff && (
              <Tab
                icon={<SecurityIcon />}
                iconPosition="start"
                label="Moderation Desk"
                component={Link}
                href={`/communities/${community.id}/moderation`}
              />
            )}
            {isAdmin && (
              <Tab
                icon={<SettingsIcon />}
                iconPosition="start"
                label="Settings"
                component={Link}
                href={`/communities/${community.id}/settings`}
              />
            )}
          </Tabs>
        </Box>
      </Box>

      {/* Rules Modal */}
      <Dialog open={openRulesModal} onClose={() => setOpenRulesModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon color="primary" /> Community Rules & Guidelines
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            To maintain a healthy and productive collaboration space, all members must adhere to these guidelines:
          </Typography>
          <List>
            {community.rules.map((rule, idx) => (
              <ListItem key={idx} alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <Chip
                    label={idx + 1}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700, height: 24, width: 24, borderRadius: '50%' }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={rule}
                  primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenRulesModal(false)} variant="contained" sx={{ borderRadius: '10px' }}>
            Got It
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={openInviteModal} onClose={() => setOpenInviteModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" /> Invite Peers to Community
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
            />
            <TextField
              select
              label="Role Assignment"
              fullWidth
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="member">Member</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenInviteModal(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSendInvite} variant="contained" disabled={!inviteEmail}>
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarMessage(null)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
