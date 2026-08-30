'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Stack,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import AddIcon from '@mui/icons-material/Add';

import { CareerPreferences } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';
import { tokens } from '../../theme/tokens';

interface CareerPreferencesEditorProps {
  initialPreferences?: CareerPreferences;
  onSave?: (updated: CareerPreferences) => void;
}

export const CareerPreferencesEditor: React.FC<CareerPreferencesEditorProps> = ({
  initialPreferences,
  onSave,
}) => {
  const [openToWork, setOpenToWork] = useState(initialPreferences?.openToWork ?? false);
  const [openToRecruiters, setOpenToRecruiters] = useState(initialPreferences?.openToRecruiters ?? false);
  const [availabilityStatus, setAvailabilityStatus] = useState(
    initialPreferences?.availabilityStatus ?? 'open_to_work'
  );
  const [targetRoles, setTargetRoles] = useState<string[]>(
    initialPreferences?.targetRoles ?? []
  );
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    initialPreferences?.preferredLocations ?? []
  );

  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddRole = () => {
    if (roleInput.trim() && !targetRoles.includes(roleInput.trim())) {
      setTargetRoles([...targetRoles, roleInput.trim()]);
      setRoleInput('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setTargetRoles(targetRoles.filter((r) => r !== role));
  };

  const handleAddLocation = () => {
    if (locationInput.trim() && !preferredLocations.includes(locationInput.trim())) {
      setPreferredLocations([...preferredLocations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== loc));
  };

  const handleSave = async () => {
    setSaving(true);
    const updated: CareerPreferences = {
      openToWork,
      openToRecruiters,
      availabilityStatus,
      targetRoles,
      preferredLocations,
    };

    try {
      await profileApi.updateCareerPreferences(updated);
      setToastMessage('Career preferences saved successfully.');
      onSave?.(updated);
    } catch {
      setToastMessage('Failed to save career preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        p: { xs: 2.5, sm: 3.5 },
        mb: 4,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
        <WorkOutlineIcon color="primary" sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Career & Job Preferences
        </Typography>
      </Stack>

      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <FormControlLabel
            control={
              <Switch
                checked={openToWork}
                onChange={(e) => setOpenToWork(e.target.checked)}
                color="primary"
              />
            }
            label="Open to Work (Display badge on profile)"
          />

          <FormControlLabel
            control={
              <Switch
                checked={openToRecruiters}
                onChange={(e) => setOpenToRecruiters(e.target.checked)}
                color="primary"
              />
            }
            label="Visible to Verified Recruiters"
          />
        </Stack>

        <FormControl fullWidth size="small">
          <InputLabel id="availability-status-label">Current Availability Status</InputLabel>
          <Select
            labelId="availability-status-label"
            label="Current Availability Status"
            value={availabilityStatus}
            onChange={(e) => setAvailabilityStatus(e.target.value)}
          >
            <MenuItem value="open_to_work">Actively looking for work</MenuItem>
            <MenuItem value="open_to_offers">Open to opportunities (Passive)</MenuItem>
            <MenuItem value="available_for_freelance">Available for consulting / freelance</MenuItem>
            <MenuItem value="looking_for_networking">Networking & mentorship only</MenuItem>
            <MenuItem value="not_available">Not available for new roles</MenuItem>
          </Select>
        </FormControl>

        {/* Target Roles */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Target Roles & Titles
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <TextField
              size="small"
              placeholder="e.g. Staff Engineer, Product Manager"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRole();
                }
              }}
              fullWidth
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddRole}
              startIcon={<AddIcon />}
              sx={{ flexShrink: 0 }}
            >
              Add Role
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
            {targetRoles.map((role) => (
              <Chip
                key={role}
                label={role}
                onDelete={() => handleRemoveRole(role)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>

        {/* Preferred Locations */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Preferred Work Locations & Modes
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <TextField
              size="small"
              placeholder="e.g. San Francisco, Remote, Hybrid"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLocation();
                }
              }}
              fullWidth
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddLocation}
              startIcon={<AddIcon />}
              sx={{ flexShrink: 0 }}
            >
              Add Location
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
            {preferredLocations.map((loc) => (
              <Chip
                key={loc}
                label={loc}
                onDelete={() => handleRemoveLocation(loc)}
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ pt: 1 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={<SaveOutlinedIcon />}
            sx={{ borderRadius: `${tokens.radius.md}px`, px: 3 }}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </Stack>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setToastMessage(null)}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default CareerPreferencesEditor;
