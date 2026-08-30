'use client';

import React from 'react';
import {
  Card,
  Typography,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
} from '@mui/material';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { tokens } from '../../theme/tokens';

export interface PeopleFilterState {
  role?: string;
  company?: string;
  skills?: string;
  industry?: string;
  location?: string;
  degree?: string;
  openToWork?: boolean;
}

interface PeopleFiltersProps {
  filters: PeopleFilterState;
  onChange: (newFilters: PeopleFilterState) => void;
  onReset: () => void;
}

export const PeopleFilters: React.FC<PeopleFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        p: 2.5,
        mb: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TuneOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Discovery Filters
          </Typography>
        </Stack>
        <Button size="small" onClick={onReset} sx={{ fontWeight: 700 }}>
          Reset Filters
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Role / Title"
            placeholder="Ex: Frontend Engineer, Staff Architect"
            value={filters.role || ''}
            onChange={(e) => onChange({ ...filters, role: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Company"
            placeholder="Ex: Kirmya Tech, Cloud AI"
            value={filters.company || ''}
            onChange={(e) => onChange({ ...filters, company: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Skills"
            placeholder="Ex: React, Go, PyTorch"
            value={filters.skills || ''}
            onChange={(e) => onChange({ ...filters, skills: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Location"
            placeholder="Ex: Dubai, Abu Dhabi, Remote"
            value={filters.location || ''}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            select
            label="Network Degree"
            value={filters.degree || 'all'}
            onChange={(e) => onChange({ ...filters, degree: e.target.value })}
          >
            <MenuItem value="all">All Degrees</MenuItem>
            <MenuItem value="1st">1st-Degree (Connected)</MenuItem>
            <MenuItem value="2nd">2nd-Degree (Shared Contacts)</MenuItem>
            <MenuItem value="3rd">3rd-Degree+</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={4} display="flex" alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(filters.openToWork)}
                onChange={(e) => onChange({ ...filters, openToWork: e.target.checked })}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Open to Opportunities
              </Typography>
            }
          />
        </Grid>
      </Grid>
    </Card>
  );
};

export default PeopleFilters;
