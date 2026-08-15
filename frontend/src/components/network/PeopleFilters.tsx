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
import FilterListIcon from '@mui/icons-material/FilterList';

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
      sx={{
        borderRadius: '24px',
        p: 3,
        mb: 3,
        backdropFilter: 'blur(16px)',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterListIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Search & Discovery Filters
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
            placeholder="Ex: Frontend Engineer, Tech Lead"
            value={filters.role || ''}
            onChange={(e) => onChange({ ...filters, role: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Company"
            placeholder="Ex: Kirmya Tech, DataGen"
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
            label="Industry"
            placeholder="Ex: Technology, AI, Finance"
            value={filters.industry || ''}
            onChange={(e) => onChange({ ...filters, industry: e.target.value })}
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
            select
            fullWidth
            size="small"
            label="Connection Degree"
            value={filters.degree || 'all'}
            onChange={(e) => onChange({ ...filters, degree: e.target.value })}
          >
            <MenuItem value="all">All Degrees</MenuItem>
            <MenuItem value="1st">1st-Degree (Direct Connections)</MenuItem>
            <MenuItem value="2nd">2nd-Degree (Shared Mutuals)</MenuItem>
            <MenuItem value="3rd">3rd-Degree +</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.openToWork || false}
                onChange={(e) => onChange({ ...filters, openToWork: e.target.checked })}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                #OpenToWork Candidates Only
              </Typography>
            }
          />
        </Grid>
      </Grid>
    </Card>
  );
};

export default PeopleFilters;
