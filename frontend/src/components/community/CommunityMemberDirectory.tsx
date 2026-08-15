import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SecurityIcon from '@mui/icons-material/Security';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { CommunityMember } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';

interface CommunityMemberDirectoryProps {
  communityId: string;
  members: CommunityMember[];
  userRole?: string | null;
  onMemberUpdated?: () => void;
}

export const CommunityMemberDirectory: React.FC<CommunityMemberDirectoryProps> = ({
  communityId,
  members: initialMembers,
  userRole,
  onMemberUpdated,
}) => {
  const [members, setMembers] = useState<CommunityMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Menu & Dialog state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'moderator' | 'member'>('member');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.title && m.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.company && m.company.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === 'all' ||
      (selectedRoleFilter === 'leadership' && (m.role === 'owner' || m.role === 'admin' || m.role === 'moderator')) ||
      m.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleChipColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'error';
      case 'admin':
        return 'secondary';
      case 'moderator':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, member: CommunityMember) => {
    setAnchorEl(e.currentTarget);
    setSelectedMember(member);
    setNewRole(member.role === 'owner' ? 'admin' : member.role as any);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAssignRoleSubmit = async () => {
    if (!selectedMember) return;
    await communityApi.assignRole(communityId, selectedMember.userId, newRole);
    setMembers(
      members.map((m) => (m.userId === selectedMember.userId ? { ...m, role: newRole } : m))
    );
    setToastMessage(`Assigned role ${newRole} to ${selectedMember.name}`);
    setOpenRoleDialog(false);
    handleMenuClose();
    if (onMemberUpdated) onMemberUpdated();
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    await communityApi.removeMember(communityId, selectedMember.userId);
    setMembers(members.filter((m) => m.userId !== selectedMember.userId));
    setToastMessage(`Removed ${selectedMember.name} from group.`);
    handleMenuClose();
    if (onMemberUpdated) onMemberUpdated();
  };

  return (
    <Box data-testid="community-member-directory">
      {/* Search & Filter Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '20px',
          background: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(16px)',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(99, 102, 241, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Typography variant="h6" fontWeight={800} gutterBottom>
          Community Member Directory ({filteredMembers.length})
        </Typography>

        <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Grid item xs={12} md={7}>
            <TextField
              placeholder="Search members by name, title, email, or company..."
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {['all', 'leadership', 'admin', 'moderator', 'member'].map((roleKey) => (
                <Chip
                  key={roleKey}
                  label={roleKey.toUpperCase()}
                  color={selectedRoleFilter === roleKey ? 'primary' : 'default'}
                  onClick={() => setSelectedRoleFilter(roleKey)}
                  sx={{ fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Directory Grid */}
      <Grid container spacing={3}>
        {filteredMembers.map((member) => (
          <Grid item xs={12} sm={6} md={4} key={member.id}>
            <Card
              data-testid={`member-card-${member.id}`}
              sx={{
                height: '100%',
                borderRadius: '20px',
                p: 1,
                background: (theme) =>
                  theme.palette.mode === 'light' ? '#ffffff' : 'rgba(30, 41, 59, 0.75)',
                backdropFilter: 'blur(12px)',
                transition: 'transform 0.2s ease, boxShadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'light'
                      ? '0 12px 28px rgba(99, 102, 241, 0.15)'
                      : '0 12px 28px rgba(0, 0, 0, 0.4)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    src={member.avatar}
                    alt={member.name}
                    sx={{ width: 56, height: 56, fontWeight: 700, bgcolor: 'primary.main' }}
                  >
                    {member.name.charAt(0)}
                  </Avatar>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip
                      label={member.role}
                      size="small"
                      color={getRoleChipColor(member.role)}
                      sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                    />
                    {isAdmin && member.role !== 'owner' && (
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, member)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </Box>

                <Typography variant="h6" fontWeight={700} noWrap>
                  {member.name}
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight={600} noWrap>
                  {member.title || 'Community Member'}
                </Typography>
                {member.company && (
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {member.company}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, mb: 2 }}>
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MailOutlineIcon />}
                    fullWidth
                    sx={{ borderRadius: '10px', fontWeight: 700 }}
                  >
                    Message
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    fullWidth
                    sx={{
                      borderRadius: '10px',
                      fontWeight: 700,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    Connect
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Admin Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => setOpenRoleDialog(true)}>
          <SecurityIcon fontSize="small" sx={{ mr: 1 }} /> Change Role
        </MenuItem>
        <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
          <RemoveCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Remove Member
        </MenuItem>
      </Menu>

      {/* Change Role Dialog */}
      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Change Role for {selectedMember?.name}</DialogTitle>
        <DialogContent dividers>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 700 }}>
              Select New Permission Level
            </FormLabel>
            <RadioGroup value={newRole} onChange={(e: any) => setNewRole(e.target.value)}>
              <FormControlLabel value="member" control={<Radio />} label="Member (Standard access)" />
              <FormControlLabel value="moderator" control={<Radio />} label="Moderator (Pin, lock, manage reports)" />
              <FormControlLabel value="admin" control={<Radio />} label="Admin (Full community management)" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignRoleSubmit} variant="contained">
            Save Role
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setToastMessage(null)}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
