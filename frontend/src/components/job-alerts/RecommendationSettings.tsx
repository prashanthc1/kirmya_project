'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import WorkIcon from '@mui/icons-material/Work';

export const RecommendationSettings: React.FC = () => {
  const [openToWork, setOpenToWork] = useState('open');
  const [remotePref, setRemotePref] = useState('Remote');
  const [salaryMin, setSalaryMin] = useState(140000);
  const [targetTitles, setTargetTitles] = useState('Senior Full-Stack Engineer, Staff Architect');

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3.5,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <SettingsIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          AI Match Preference Settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Open To Work Status"
            fullWidth
            value={openToWork}
            onChange={(e) => setOpenToWork(e.target.value)}
          >
            <MenuItem value="open">Open To Work (Actively Applying)</MenuItem>
            <MenuItem value="casually_looking">Casually Looking (Open to Offers)</MenuItem>
            <MenuItem value="not_looking">Not Looking (Invisible to Recruiters)</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Preferred Remote Arrangement"
            fullWidth
            value={remotePref}
            onChange={(e) => setRemotePref(e.target.value)}
          >
            <MenuItem value="Remote">100% Remote Only</MenuItem>
            <MenuItem value="Hybrid">Hybrid (Flexible)</MenuItem>
            <MenuItem value="On-site">On-site Preferred</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Minimum Base Salary Expectation ($)"
            type="number"
            fullWidth
            value={salaryMin}
            onChange={(e) => setSalaryMin(Number(e.target.value))}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Target Job Titles (Comma-separated)"
            fullWidth
            value={targetTitles}
            onChange={(e) => setTargetTitles(e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Save Recommendation Settings
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};
