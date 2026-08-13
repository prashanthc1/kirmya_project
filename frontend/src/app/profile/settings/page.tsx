'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Box,
  Stack,
  Divider,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { profileApi } from '@/features/profile/services/profileApi';

export default function ProfileSettingsPage() {
  const [visibility, setVisibility] = useState('public');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updatePrivacy(visibility);
      alert('Profile visibility preferences saved successfully!');
    } catch (e) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LockIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Profile Visibility & Privacy Controls
        </Typography>
      </Stack>

      <Card sx={{ p: 3.5, borderRadius: '24px', bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          Who can see your profile on Kirmya?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Server-side privacy enforcement ensures restricted data is never leaked via API responses.
        </Typography>

        <RadioGroup value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '16px', mb: 2 }}>
            <FormControlLabel
              value="public"
              control={<Radio />}
              label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Public (Everyone on & off Kirmya)</Typography>}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Your headline, skills, work experience, and public achievements can be indexed and viewed by anyone.
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '16px', mb: 2 }}>
            <FormControlLabel
              value="connections_only"
              control={<Radio />}
              label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Verified Kirmya Members Only</Typography>}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Only authenticated signed-in members can view your full candidate profile.
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '16px', mb: 3 }}>
            <FormControlLabel
              value="private"
              control={<Radio />}
              label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Private / Connections Only</Typography>}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Restricted visibility to only your accepted professional connections and recruiters you communicate with.
            </Typography>
          </Box>
        </RadioGroup>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2, width: '100%' }}
        >
          Save Privacy Settings
        </Button>
      </Card>
    </Container>
  );
}
