'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  Box,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';

import { EducationItem } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';
import { tokens } from '../../theme/tokens';

export const EducationEditor: React.FC<{ initialEducations?: EducationItem[] }> = ({
  initialEducations = [],
}) => {
  const [educations, setEducations] = useState<EducationItem[]>(initialEducations);
  const [newEdu, setNewEdu] = useState<EducationItem>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  const handleAdd = async () => {
    if (!newEdu.institution.trim() || !newEdu.degree.trim()) {
      setToastSeverity('error');
      setToastMessage('Institution and Degree are required.');
      return;
    }

    setSaving(true);
    try {
      const updated = await profileApi.addEducation(newEdu);
      setEducations(Array.isArray(updated) ? updated : [...educations, { ...newEdu, id: String(Date.now()) }]);
      setNewEdu({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        description: '',
      });
      setToastSeverity('success');
      setToastMessage('Education record added successfully.');
    } catch {
      setToastSeverity('error');
      setToastMessage('Failed to add education record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await profileApi.deleteEducation(id);
      setEducations(educations.filter((e) => e.id !== id));
      setToastSeverity('success');
      setToastMessage('Education record deleted.');
    } catch {
      setToastSeverity('error');
      setToastMessage('Failed to delete education record.');
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
        <SchoolOutlinedIcon color="primary" sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          3. Education & Academic Credentials
        </Typography>
      </Stack>

      {/* Add New Education Form */}
      <Box sx={{ mb: 4, p: 2.5, borderRadius: `${tokens.radius.md}px`, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          Add Degree or Certificate
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Institution / University *"
              value={newEdu.institution}
              onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
              placeholder="e.g. Stanford University, MIT"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Degree *"
              value={newEdu.degree}
              onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
              placeholder="e.g. Bachelor of Science, Master of Engineering"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Field of Study"
              value={newEdu.fieldOfStudy || ''}
              onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
              placeholder="e.g. Computer Science, Artificial Intelligence"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={newEdu.startDate || ''}
              onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={newEdu.endDate || ''}
              onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Activities & Honors"
              value={newEdu.description || ''}
              onChange={(e) => setNewEdu({ ...newEdu, description: e.target.value })}
              placeholder="Relevant coursework, honors, leadership positions..."
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
            {saving ? 'Adding...' : 'Add Education'}
          </Button>
        </Box>
      </Box>

      {/* Existing Education Records */}
      {educations.length > 0 ? (
        <Stack spacing={2} divider={<Divider />}>
          {educations.map((edu, idx) => (
            <Stack
              key={edu.id || idx}
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {edu.institution}
                </Typography>
                {(edu.startDate || edu.endDate) && (
                  <Typography variant="caption" color="text.secondary">
                    {edu.startDate} – {edu.endDate || 'Present'}
                  </Typography>
                )}
                {edu.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {edu.description}
                  </Typography>
                )}
              </Box>

              <Tooltip title="Delete education record">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(edu.id)}
                  aria-label={`Delete ${edu.degree} at ${edu.institution}`}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No education history listed yet. Add your academic background using the form above.
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

export default EducationEditor;
