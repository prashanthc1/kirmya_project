'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

import { WorkExperienceItem } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';
import { tokens } from '../../theme/tokens';

export const ExperienceEditor: React.FC<{ initialExperiences?: WorkExperienceItem[] }> = ({
  initialExperiences = [],
}) => {
  const [experiences, setExperiences] = useState<WorkExperienceItem[]>(initialExperiences);
  const [newExp, setNewExp] = useState<WorkExperienceItem>({
    company: '',
    jobTitle: '',
    employmentType: 'Full-time',
    location: '',
    startDate: '',
    endDate: '',
    isCurrentJob: false,
    description: '',
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  const handleAdd = async () => {
    if (!newExp.company.trim() || !newExp.jobTitle.trim() || !newExp.startDate) {
      setToastSeverity('error');
      setToastMessage('Company, Job Title, and Start Date are required.');
      return;
    }
    if (newExp.endDate && !newExp.isCurrentJob && newExp.endDate < newExp.startDate) {
      setToastSeverity('error');
      setToastMessage('End date cannot precede start date.');
      return;
    }

    setSaving(true);
    try {
      const updated = await profileApi.addExperience(newExp);
      setExperiences(Array.isArray(updated) ? updated : [...experiences, { ...newExp, id: String(Date.now()) }]);
      setNewExp({
        company: '',
        jobTitle: '',
        employmentType: 'Full-time',
        location: '',
        startDate: '',
        endDate: '',
        isCurrentJob: false,
        description: '',
      });
      setToastSeverity('success');
      setToastMessage('Work experience added successfully.');
    } catch {
      setToastSeverity('error');
      setToastMessage('Failed to add experience. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await profileApi.deleteExperience(id);
      setExperiences(experiences.filter((e) => e.id !== id));
      setToastSeverity('success');
      setToastMessage('Experience entry deleted.');
    } catch {
      setToastSeverity('error');
      setToastMessage('Failed to delete experience.');
    }
  };

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        p: { xs: 2.5, sm: 3.5 },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
        <WorkOutlineIcon color="primary" sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          2. Work Experience
        </Typography>
      </Stack>

      {/* Add New Experience Form */}
      <Box sx={{ mb: 4, p: 2.5, borderRadius: `${tokens.radius.md}px`, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          Add New Position
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Company Name *"
              value={newExp.company}
              onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
              placeholder="e.g. Google, Apple, Microsoft"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Job Title *"
              value={newExp.jobTitle}
              onChange={(e) => setNewExp({ ...newExp, jobTitle: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date *"
              InputLabelProps={{ shrink: true }}
              value={newExp.startDate}
              onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              disabled={newExp.isCurrentJob}
              value={newExp.endDate || ''}
              onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Location"
              value={newExp.location || ''}
              onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
              placeholder="e.g. San Francisco, CA or Remote"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(newExp.isCurrentJob)}
                  onChange={(e) => setNewExp({ ...newExp, isCurrentJob: e.target.checked })}
                  color="primary"
                />
              }
              label="I currently work here"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Key Responsibilities & Achievements"
              value={newExp.description || ''}
              onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
              placeholder="Highlight major contributions, systems architected, or metrics improved..."
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleAdd}
            disabled={saving}
            startIcon={<AddIcon />}
            sx={{ borderRadius: `${tokens.radius.md}px` }}
          >
            {saving ? 'Adding...' : 'Add Experience'}
          </Button>
        </Box>
      </Box>

      {/* Existing Experiences List */}
      {experiences.length > 0 ? (
        <Stack spacing={2} divider={<Divider />}>
          {experiences.map((exp, idx) => (
            <Stack
              key={exp.id || idx}
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {exp.jobTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {exp.company} {exp.employmentType ? `• ${exp.employmentType}` : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {exp.startDate} – {exp.isCurrentJob ? 'Present' : exp.endDate || 'Present'}
                  {exp.location ? ` • ${exp.location}` : ''}
                </Typography>
                {exp.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, whiteSpace: 'pre-line' }}>
                    {exp.description}
                  </Typography>
                )}
              </Box>

              <Tooltip title="Delete position">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(exp.id)}
                  aria-label={`Delete ${exp.jobTitle} at ${exp.company}`}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No work experiences added yet. Fill out the form above to add your first position.
        </Typography>
      )}

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toastSeverity} onClose={() => setToastMessage(null)}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ExperienceEditor;
