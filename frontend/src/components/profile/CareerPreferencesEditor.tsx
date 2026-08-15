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
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import { CareerPreferences } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';

interface CareerPreferencesEditorProps {
  initialPreferences?: CareerPreferences;
  onSave?: (updated: CareerPreferences) => void;
}

export const CareerPreferencesEditor: React.FC<CareerPreferencesEditorProps> = ({
  initialPreferences,
  onSave,
}) => {
  const [openToWork, setOpenToWork] = useState(initialPreferences?.openToWork ?? true);
  const [openToRecruiters, setOpenToRecruiters] = useState(initialPreferences?.openToRecruiters ?? true);
  const [availabilityStatus, setAvailabilityStatus] = useState(
    initialPreferences?.availabilityStatus ?? 'open_to_work'
  );
  const [targetRoles, setTargetRoles] = useState<string[]>(
    initialPreferences?.targetRoles ?? ['Senior Software Engineer', 'Engineering Lead']
  );
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    initialPreferences?.preferredLocations ?? ['Dubai, UAE', 'Remote']
  );

  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [saving, setSaving] = useState(false);

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
    const prefs: CareerPreferences = {
      openToWork,
      openToRecruiters,
      availabilityStatus,
      targetRoles,
      preferredLocations,
    };
    try {
      await profileApi.updateCareerPreferences(prefs);
      if (onSave) onSave(prefs);
    } catch (e) {
      console.error('Failed to update career preferences', e);
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
        <WorkIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Career Preferences & Job Hunt Settings
        </Typography>
      </Stack>

      <Stack spacing={3}>
        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: 'action.hover' }}>
          <FormControlLabel
            control={
              <Switch
                checked={openToWork}
                onChange={(e) => setOpenToWork(e.target.checked)}
                color="success"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  #OpenToWork Badge Visibility
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Display the green #OpenToWork frame on your profile photo for all recruiters and connections.
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: 'action.hover' }}>
          <FormControlLabel
            control={
              <Switch
                checked={openToRecruiters}
                onChange={(e) => setOpenToRecruiters(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Private Recruiter Signal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Signal confidentially to verified corporate recruiters that you are open to new career opportunities.
                </Typography>
              </Box>
            }
          />
        </Box>

        <FormControl fullWidth>
          <InputLabel id="availability-label">Availability Status</InputLabel>
          <Select
            labelId="availability-label"
            value={availabilityStatus}
            label="Availability Status"
            onChange={(e) => setAvailabilityStatus(e.target.value)}
            sx={{ borderRadius: '12px', fontWeight: 700 }}
          >
            <MenuItem value="open_to_work">Immediately Available</MenuItem>
            <MenuItem value="1_month">1 Month Notice Period</MenuItem>
            <MenuItem value="2_months">2 Months Notice Period</MenuItem>
            <MenuItem value="casually_looking">Casually Exploring</MenuItem>
            <MenuItem value="not_looking">Not Looking Currently</MenuItem>
          </Select>
        </FormControl>

        {/* Target Roles */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Target Job Roles
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add job title (e.g. Solutions Architect)"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRole();
                }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <Button
              variant="outlined"
              onClick={handleAddRole}
              startIcon={<AddIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, px: 2 }}
            >
              Add
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {targetRoles.map((role) => (
              <Chip
                key={role}
                label={role}
                onDelete={() => handleRemoveRole(role)}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, borderRadius: '8px', mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Preferred Locations */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Preferred Work Locations
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add location (e.g. Dubai, Remote)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLocation();
                }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <Button
              variant="outlined"
              onClick={handleAddLocation}
              startIcon={<AddIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, px: 2 }}
            >
              Add
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {preferredLocations.map((loc) => (
              <Chip
                key={loc}
                label={loc}
                onDelete={() => handleRemoveLocation(loc)}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 700, borderRadius: '8px', mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.2 }}
        >
          {saving ? 'Saving Preferences...' : 'Save Career Preferences'}
        </Button>
      </Stack>
    </Card>
  );
};

export default CareerPreferencesEditor;
