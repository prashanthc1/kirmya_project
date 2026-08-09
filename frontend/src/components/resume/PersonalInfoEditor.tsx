'use client';

import React from 'react';
import { Box, TextField, Grid, Typography, FormControlLabel, Switch } from '@mui/material';
import { PersonalInfoContent } from '@/features/resume/types';

interface PersonalInfoEditorProps {
  data: PersonalInfoContent;
  onChange: (updated: PersonalInfoContent) => void;
}

export const PersonalInfoEditor: React.FC<PersonalInfoEditorProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof PersonalInfoContent, val: string) => {
    onChange({ ...data, [field]: val });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Personal Information & Contact Details
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Full Name"
            value={data.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Professional Title"
            value={data.professionalTitle || ''}
            onChange={(e) => handleChange('professionalTitle', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email Address"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City, Country"
            value={data.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Personal Website / Portfolio URL"
            value={data.portfolioUrl || ''}
            onChange={(e) => handleChange('portfolioUrl', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="LinkedIn URL"
            value={data.linkedinUrl || ''}
            onChange={(e) => handleChange('linkedinUrl', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="GitHub URL"
            value={data.githubUrl || ''}
            onChange={(e) => handleChange('githubUrl', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
