import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Community } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';

interface CommunitySettingsTabProps {
  community: Community;
  onSave?: (updated: Partial<Community>) => void;
  onDelete?: () => void;
}

export const CommunitySettingsTab: React.FC<CommunitySettingsTabProps> = ({
  community,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState(community.title);
  const [description, setDescription] = useState(community.description);
  const [category, setCategory] = useState(community.category);
  const [location, setLocation] = useState(community.location || '');
  const [avatarUrl, setAvatarUrl] = useState(community.avatarUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(community.coverImageUrl || '');
  const [isPrivate, setIsPrivate] = useState(community.isPrivate);
  const [postingPermission, setPostingPermission] = useState(community.postingPermission);
  const [rules, setRules] = useState<string>(community.rules.join('\n'));

  const [saving, setSaving] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    const parsedRules = rules
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const updates: Partial<Community> = {
      title,
      description,
      category,
      location,
      avatarUrl,
      coverImageUrl,
      isPrivate,
      postingPermission,
      rules: parsedRules,
    };

    const updated = await communityApi.updateCommunity(community.id, updates);
    setSaving(false);
    setToastMsg('Community settings successfully saved.');
    if (onSave) onSave(updated);
  };

  const handleDeleteConfirm = async () => {
    await communityApi.deleteCommunity(community.id);
    setOpenDeleteDialog(false);
    if (onDelete) onDelete();
  };

  return (
    <Paper
      data-testid="community-settings-tab"
      elevation={0}
      sx={{
        p: 4,
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <SettingsIcon color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight={800}>
          Community Settings & Governance
        </Typography>
      </Box>

      <Stack spacing={3}>
        <TextField
          label="Community Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="Description"
          multiline
          rows={3}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Category"
            fullWidth
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <TextField
            label="Location"
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Avatar Image URL"
            fullWidth
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <TextField
            label="Cover Image URL"
            fullWidth
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
          />
        </Stack>

        <Box
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ ml: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Private Community Mode
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Require admin approval for new member requests.
                </Typography>
              </Box>
            }
          />
        </Box>

        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
            Posting Permissions
          </FormLabel>
          <RadioGroup
            value={postingPermission}
            onChange={(e: any) => setPostingPermission(e.target.value)}
          >
            <FormControlLabel value="all" control={<Radio />} label="All Members can post" />
            <FormControlLabel value="approved_only" control={<Radio />} label="Approved Members only" />
            <FormControlLabel value="mods_only" control={<Radio />} label="Admins & Mods only" />
          </RadioGroup>
        </FormControl>

        <TextField
          label="Community Rules (One per line)"
          multiline
          rows={4}
          fullWidth
          value={rules}
          onChange={(e) => setRules(e.target.value)}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: '12px', fontWeight: 700, px: 4 }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setOpenDeleteDialog(true)}
            sx={{ borderRadius: '12px', fontWeight: 700 }}
          >
            Delete Community
          </Button>
        </Box>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Delete Community?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            This action is permanent and will remove all posts, resources, events, and member records.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toastMsg}
        autoHideDuration={4000}
        onClose={() => setToastMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setToastMsg(null)}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
