import React from 'react';
import {
  Box,
  Drawer,
  Paper,
  Typography,
  IconButton,
  Button,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Chip,
  Autocomplete,
  Divider,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckIcon from '@mui/icons-material/Check';
import { SearchFilterParams } from '../../features/search/types';
import { tokens } from '../../theme/tokens';

export interface SearchFiltersSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilterParams;
  onFilterChange: (filters: SearchFilterParams) => void;
  onResetFilters?: () => void;
  onReset?: () => void;
  onApplyFilters?: () => void;
  isDrawer?: boolean;
}

const WORK_ARRANGEMENTS = ['Remote', 'Hybrid', 'On-site'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const EXPERIENCE_LEVELS = ['Entry-level', 'Mid-level', 'Senior', 'Lead', 'Executive'];
const INDUSTRIES = [
  'Technology',
  'Finance & FinTech',
  'Healthcare',
  'Education',
  'E-commerce',
  'Media & Entertainment',
];
const SUGGESTED_SKILLS = [
  'React',
  'Go',
  'TypeScript',
  'PostgreSQL',
  'Node.js',
  'Python',
  'GraphQL',
  'AWS',
  'Docker',
  'Kubernetes',
];

export const SearchFiltersSidebar: React.FC<SearchFiltersSidebarProps> = ({
  open,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  onReset,
  onApplyFilters,
  isDrawer = false,
}) => {
  const handleChange = (field: keyof SearchFilterParams, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleReset = () => {
    if (onReset) onReset();
    if (onResetFilters) onResetFilters();
  };

  const content = (
    <Box
      sx={{
        p: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${tokens.radius.lg}px`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterListIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Search Filters
          </Typography>
        </Stack>

        <Button
          size="small"
          startIcon={<RestartAltIcon fontSize="small" />}
          onClick={handleReset}
          sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
        >
          Reset
        </Button>
      </Box>

      <Stack spacing={2.5}>
        {/* Location Filter */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
            Location
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Dubai, UAE or Remote"
            value={filters.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </Box>

        {/* Work Arrangement */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
            Work Arrangement
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.75 }}>
            {WORK_ARRANGEMENTS.map((wa) => {
              const selected = filters.workArrangement === wa;
              return (
                <Chip
                  key={wa}
                  label={wa}
                  size="small"
                  variant={selected ? 'filled' : 'outlined'}
                  color={selected ? 'primary' : 'default'}
                  onClick={() => handleChange('workArrangement', selected ? undefined : wa)}
                  sx={{ fontWeight: 700 }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Employment Type */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
            Employment Type
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.75 }}>
            {EMPLOYMENT_TYPES.map((et) => {
              const selected = filters.employmentType === et;
              return (
                <Chip
                  key={et}
                  label={et}
                  size="small"
                  variant={selected ? 'filled' : 'outlined'}
                  color={selected ? 'primary' : 'default'}
                  onClick={() => handleChange('employmentType', selected ? undefined : et)}
                  sx={{ fontWeight: 700 }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Industry */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
            Industry
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.industry || ''}
              displayEmpty
              onChange={(e) => handleChange('industry', e.target.value || undefined)}
            >
              <MenuItem value="">All Industries</MenuItem>
              {INDUSTRIES.map((ind) => (
                <MenuItem key={ind} value={ind}>
                  {ind}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Skills Filter */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
            Skills & Technologies
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            options={SUGGESTED_SKILLS}
            value={filters.skills || []}
            onChange={(_, val) => handleChange('skills', val)}
            renderInput={(params) => <TextField {...params} size="small" placeholder="Add skills..." />}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option} size="small" {...tagProps} />;
              })
            }
          />
        </Box>
      </Stack>
    </Box>
  );

  if (isDrawer) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ width: 320, p: 2 }}>
          {content}
        </Box>
      </Drawer>
    );
  }

  return content;
};

export default SearchFiltersSidebar;
