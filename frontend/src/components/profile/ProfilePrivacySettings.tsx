'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Box,
  Stack,
  Switch,
  Divider,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import { ProfilePrivacySettingsData } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';

interface ProfilePrivacySettingsProps {
  initialSettings?: Partial<ProfilePrivacySettingsData>;
  onSave?: (settings: ProfilePrivacySettingsData) => void;
}

export const ProfilePrivacySettings: React.FC<ProfilePrivacySettingsProps> = ({
  initialSettings,
  onSave,
}) => {
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'connections_only' | 'private'>(
    initialSettings?.profileVisibility ?? 'public'
  );
  const [searchIndexing, setSearchIndexing] = useState(initialSettings?.searchIndexing ?? true);
  const [contactPrivacy, setContactPrivacy] = useState<'everyone' | 'connections_only' | 'none'>(
    initialSettings?.contactPrivacy ?? 'everyone'
  );
  const [showEmail, setShowEmail] = useState(initialSettings?.showEmail ?? false);
  const [showPhone, setShowPhone] = useState(initialSettings?.showPhone ?? false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSave = async () => {
    setSaving(true);
    const settings: ProfilePrivacySettingsData = {
      profileVisibility,
      searchIndexing,
      contactPrivacy,
      showEmail,
      showPhone,
    };
    try {
      await profileApi.updatePrivacySettings(settings);
      setFeedback('Privacy preferences updated successfully!');
      if (onSave) onSave(settings);
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error('Failed to update privacy settings', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      sx={{
        p: 3.5,
        borderRadius: '24px',
        mb: 3,
        bgcolor: 'background.paper',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LockIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Profile Privacy & Account Discovery Controls
        </Typography>
      </Stack>

      {feedback && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
          {feedback}
        </Alert>
      )}

      <Stack spacing={3.5}>
        {/* Profile Visibility */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <VisibilityIcon color="action" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Profile Visibility Level
            </Typography>
          </Stack>

          <RadioGroup
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'connections_only' | 'private')}
          >
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '16px', mb: 1.5 }}>
              <FormControlLabel
                value="public"
                control={<Radio />}
                label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Public (Open Discovery)</Typography>}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Your complete candidate profile can be viewed by all guests, registered members, and search engines.
              </Typography>
            </Box>

            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '16px', mb: 1.5 }}>
              <FormControlLabel
                value="connections_only"
                control={<Radio />}
                label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Verified Kirmya Members Only</Typography>}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Only authenticated, logged-in members on the Kirmya network can view your full profile details.
              </Typography>
            </Box>

            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '16px' }}>
              <FormControlLabel
                value="private"
                control={<Radio />}
                label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Private / Connections Only</Typography>}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Restricted mode. Only accepted professional connections can see your activity and work background.
              </Typography>
            </Box>
          </RadioGroup>
        </Box>

        <Divider />

        {/* Search Engine Indexing */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SearchIcon color="action" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Search Engine Indexing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Allow search engines (Google, Bing) to index your public candidate profile.
              </Typography>
            </Box>
          </Stack>
          <Switch
            checked={searchIndexing}
            onChange={(e) => setSearchIndexing(e.target.checked)}
            color="primary"
          />
        </Box>

        <Divider />

        {/* Contact Privacy */}
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <ContactMailIcon color="action" />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Direct Contact & Messaging Permissions
            </Typography>
          </Stack>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="contact-privacy-label">Who can send you direct messages?</InputLabel>
            <Select
              labelId="contact-privacy-label"
              value={contactPrivacy}
              label="Who can send you direct messages?"
              onChange={(e) => setContactPrivacy(e.target.value as 'everyone' | 'connections_only' | 'none')}
              sx={{ borderRadius: '12px', fontWeight: 700 }}
            >
              <MenuItem value="everyone">Everyone on Kirmya</MenuItem>
              <MenuItem value="connections_only">Accepted Connections Only</MenuItem>
              <MenuItem value="none">Nobody (InMail / Recruiter only)</MenuItem>
            </Select>
          </FormControl>

          <Stack spacing={1}>
            <FormControlLabel
              control={<Switch checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />}
              label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Show email address to verified connections</Typography>}
            />
            <FormControlLabel
              control={<Switch checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />}
              label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Show phone number to verified recruiters</Typography>}
            />
          </Stack>
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.3 }}
        >
          {saving ? 'Saving Privacy Preferences...' : 'Save Privacy Settings'}
        </Button>
      </Stack>
    </Card>
  );
};

export default ProfilePrivacySettings;
