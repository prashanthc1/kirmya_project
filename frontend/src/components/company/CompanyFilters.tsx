'use client';

import React from 'react';
import {
  Box,
  Typography,
  Stack,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import GlassCard from '../landing/GlassCard';
import { CompanyFilterQuery } from '../../features/companies/types';

interface CompanyFiltersProps {
  filters: CompanyFilterQuery;
  onChange: (filters: CompanyFilterQuery) => void;
  onReset: () => void;
}

export const CompanyFilters: React.FC<CompanyFiltersProps> = ({ filters, onChange, onReset }) => {
  const theme = useTheme();

  const handleSelectChange = (field: keyof CompanyFilterQuery, value: any) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <GlassCard sx={{ p: 3, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterListIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Filter Companies
          </Typography>
        </Stack>
        <Button
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Reset Filters
        </Button>
      </Stack>

      <Stack spacing={2.5}>
        {/* Sort By */}
        <TextField
          select
          size="small"
          label="Sort By"
          fullWidth
          value={filters.sort || 'most_relevant'}
          onChange={(e) => handleSelectChange('sort', e.target.value)}
        >
          <MenuItem value="most_relevant">Most Relevant</MenuItem>
          <MenuItem value="most_jobs">Most Open Jobs</MenuItem>
          <MenuItem value="followers">Most Followed</MenuItem>
          <MenuItem value="newest">Newest Added</MenuItem>
          <MenuItem value="alphabetical">Alphabetical (A-Z)</MenuItem>
        </TextField>

        {/* Industry */}
        <TextField
          select
          size="small"
          label="Industry"
          fullWidth
          value={filters.industry || ''}
          onChange={(e) => handleSelectChange('industry', e.target.value)}
        >
          <MenuItem value="">All Industries</MenuItem>
          <MenuItem value="Technology">Technology</MenuItem>
          <MenuItem value="Facilities Management & Real Estate">Facilities Management &amp; Real Estate</MenuItem>
          <MenuItem value="Healthcare">Healthcare</MenuItem>
          <MenuItem value="Aviation & Logistics">Aviation &amp; Logistics</MenuItem>
          <MenuItem value="Oil & Gas">Oil &amp; Gas</MenuItem>
          <MenuItem value="Finance & Banking">Finance &amp; Banking</MenuItem>
        </TextField>

        {/* Company Size */}
        <TextField
          select
          size="small"
          label="Company Size"
          fullWidth
          value={filters.size || ''}
          onChange={(e) => handleSelectChange('size', e.target.value)}
        >
          <MenuItem value="">Any Size</MenuItem>
          <MenuItem value="1-10">1-10 Employees</MenuItem>
          <MenuItem value="11-50">11-50 Employees</MenuItem>
          <MenuItem value="51-200">51-200 Employees</MenuItem>
          <MenuItem value="201-1000">201-1000 Employees</MenuItem>
          <MenuItem value="10000+">10,000+ Employees</MenuItem>
        </TextField>

        {/* Country */}
        <TextField
          select
          size="small"
          label="Country"
          fullWidth
          value={filters.country || ''}
          onChange={(e) => handleSelectChange('country', e.target.value)}
        >
          <MenuItem value="">All Countries</MenuItem>
          <MenuItem value="United Arab Emirates">United Arab Emirates</MenuItem>
          <MenuItem value="Saudi Arabia">Saudi Arabia</MenuItem>
          <MenuItem value="Qatar">Qatar</MenuItem>
          <MenuItem value="United States">United States</MenuItem>
          <MenuItem value="United Kingdom">United Kingdom</MenuItem>
        </TextField>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Checkboxes */}
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!filters.actively_hiring}
                onChange={(e) => handleSelectChange('actively_hiring', e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Actively Hiring Only
              </Typography>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={!!filters.verified}
                onChange={(e) => handleSelectChange('verified', e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Verified Companies Only
              </Typography>
            }
          />
        </Stack>
      </Stack>
    </GlassCard>
  );
};

export default CompanyFilters;
