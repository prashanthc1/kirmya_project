'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  InputAdornment,
  Button,
  MenuItem,
  Chip,
  IconButton,
  Collapse,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ClearIcon from '@mui/icons-material/Clear';

import { tokens } from '../../theme/tokens';

export interface JobFilterValues {
  q?: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  experience_level?: string;
  sort?: string;
}

export interface JobSearchFiltersProps {
  initialValues: JobFilterValues;
  onSearch: (values: JobFilterValues) => void;
  onClear: () => void;
}

const WORK_MODES = [
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
];

const EMPLOYMENT_TYPES = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
];

const SORTS = [
  { value: '', label: 'Featured & Newest' },
  { value: 'newest', label: 'Newest First' },
  { value: 'salary', label: 'Highest Salary' },
  { value: 'title', label: 'Job Title (A-Z)' },
];

export const JobSearchFilters: React.FC<JobSearchFiltersProps> = ({
  initialValues,
  onSearch,
  onClear,
}) => {
  const theme = useTheme();
  const [draftQuery, setDraftQuery] = useState(initialValues.q || '');
  const [draftLocation, setDraftLocation] = useState(initialValues.location || '');
  const [workMode, setWorkMode] = useState(initialValues.work_mode || '');
  const [employmentType, setEmploymentType] = useState(initialValues.employment_type || '');
  const [sort, setSort] = useState(initialValues.sort || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      q: draftQuery.trim(),
      location: draftLocation.trim(),
      work_mode: workMode,
      employment_type: employmentType,
      sort,
    });
  };

  const handleFilterChange = (key: keyof JobFilterValues, val: string) => {
    if (key === 'work_mode') setWorkMode(val);
    if (key === 'employment_type') setEmploymentType(val);
    if (key === 'sort') setSort(val);

    onSearch({
      q: draftQuery.trim(),
      location: draftLocation.trim(),
      work_mode: key === 'work_mode' ? val : workMode,
      employment_type: key === 'employment_type' ? val : employmentType,
      sort: key === 'sort' ? val : sort,
    });
  };

  const hasActiveFilters = Boolean(
    initialValues.q ||
      initialValues.location ||
      initialValues.work_mode ||
      initialValues.employment_type ||
      initialValues.sort
  );

  return (
    <Box component="section" aria-label="Job Search and Filters" sx={{ mb: 3 }}>
      {/* Primary Search Inputs Bar */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            fullWidth
            placeholder="Search job title, skills, or company"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            inputProps={{ 'aria-label': 'Search jobs by title or keyword' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: `${tokens.radius.md}px`,
            }}
          />

          <TextField
            placeholder="City, state, or remote"
            value={draftLocation}
            onChange={(e) => setDraftLocation(e.target.value)}
            inputProps={{ 'aria-label': 'Filter by location' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { md: 220 },
              bgcolor: 'background.paper',
              borderRadius: `${tokens.radius.md}px`,
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{
              px: 3.5,
              flexShrink: 0,
              borderRadius: `${tokens.radius.md}px`,
            }}
          >
            Find Jobs
          </Button>

          <Button
            variant="outlined"
            onClick={() => setShowAdvanced(!showAdvanced)}
            startIcon={<TuneOutlinedIcon />}
            sx={{
              flexShrink: 0,
              borderRadius: `${tokens.radius.md}px`,
            }}
          >
            Filters
          </Button>
        </Stack>
      </Box>

      {/* Advanced Filter Pop-down / Bar */}
      <Collapse in={showAdvanced || Boolean(workMode || employmentType || sort)}>
        <Stack
          direction="row"
          spacing={1.5}
          flexWrap="wrap"
          sx={{
            p: 2,
            mb: 2,
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)'),
            borderRadius: `${tokens.radius.md}px`,
            rowGap: 1.5,
            alignItems: 'center',
          }}
        >
          {/* Work Mode Select */}
          <TextField
            select
            size="small"
            label="Work Mode"
            value={workMode}
            onChange={(e) => handleFilterChange('work_mode', e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Work Modes</MenuItem>
            {WORK_MODES.map((mode) => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Employment Type Select */}
          <TextField
            select
            size="small"
            label="Job Type"
            value={employmentType}
            onChange={(e) => handleFilterChange('employment_type', e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Job Types</MenuItem>
            {EMPLOYMENT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Sort Select */}
          <TextField
            select
            size="small"
            label="Sort By"
            value={sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            sx={{ minWidth: 170 }}
          >
            {SORTS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          {hasActiveFilters && (
            <Button
              onClick={onClear}
              size="small"
              color="inherit"
              startIcon={<ClearIcon fontSize="small" />}
              sx={{ alignSelf: 'center', ml: 'auto' }}
            >
              Clear All Filters
            </Button>
          )}
        </Stack>
      </Collapse>

      {/* Active Filter Chips Pill Row */}
      {hasActiveFilters && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1, alignItems: 'center' }}>
          {initialValues.q && (
            <Chip
              label={`Keyword: ${initialValues.q}`}
              size="small"
              onDelete={() => {
                setDraftQuery('');
                onSearch({ ...initialValues, q: '' });
              }}
            />
          )}
          {initialValues.location && (
            <Chip
              label={`Location: ${initialValues.location}`}
              size="small"
              onDelete={() => {
                setDraftLocation('');
                onSearch({ ...initialValues, location: '' });
              }}
            />
          )}
          {initialValues.work_mode && (
            <Chip
              label={`Work: ${initialValues.work_mode}`}
              size="small"
              onDelete={() => {
                setWorkMode('');
                onSearch({ ...initialValues, work_mode: '' });
              }}
            />
          )}
          {initialValues.employment_type && (
            <Chip
              label={`Type: ${initialValues.employment_type}`}
              size="small"
              onDelete={() => {
                setEmploymentType('');
                onSearch({ ...initialValues, employment_type: '' });
              }}
            />
          )}
          {initialValues.sort && (
            <Chip
              label={`Sort: ${initialValues.sort}`}
              size="small"
              onDelete={() => {
                setSort('');
                onSearch({ ...initialValues, sort: '' });
              }}
            />
          )}
        </Stack>
      )}
    </Box>
  );
};

export default JobSearchFilters;
