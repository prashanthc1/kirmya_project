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

interface PeopleFiltersProps {
  filters: {
    location?: string;
    industry?: string;
    company?: string;
    degree?: string;
    openToWork?: boolean;
  };
  onChange: (newFilters: any) => void;
  onReset: () => void;
}

export const PeopleFilters: React.FC<PeopleFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterListIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Discovery Filters
          </Typography>
        </Stack>
        <Button size="small" onClick={onReset} sx={{ fontWeight: 700 }}>
          Reset Filters
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Location"
            value={filters.location || ''}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Industry"
            value={filters.industry || ''}
            onChange={(e) => onChange({ ...filters, industry: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Company"
            value={filters.company || ''}
            onChange={(e) => onChange({ ...filters, company: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Connection Degree"
            value={filters.degree || 'all'}
            onChange={(e) => onChange({ ...filters, degree: e.target.value })}
          >
            <MenuItem value="all">All Degrees</MenuItem>
            <MenuItem value="1st">1st-Degree (Direct)</MenuItem>
            <MenuItem value="2nd">2nd-Degree (Mutual)</MenuItem>
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
            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Open to Work (#OpenToWork Candidates Only)</Typography>}
          />
        </Grid>
      </Grid>
    </Card>
  );
};

export default PeopleFilters;
