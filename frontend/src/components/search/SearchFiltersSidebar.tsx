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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckIcon from '@mui/icons-material/Check';
import { SearchFilterParams } from '../../features/search/types';

export interface SearchFiltersSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilterParams;
  onFilterChange: (filters: SearchFilterParams) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
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
  onApplyFilters,
  isDrawer = true,
}) => {
  const handleChange = (field: keyof SearchFilterParams, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const content = (
    <Box
      sx={{
        width: 320,
        p: 3,
        bgcolor: '#0f172a',
        color: '#f8fafc',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon sx={{ color: '#38bdf8' }} />
          <Typography variant="h6" fontWeight="bold">
            Search Filters
          </Typography>
        </Box>
        {isDrawer && (
          <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

      {/* Filter Options */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Location */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#cbd5e1', mb: 1 }}>
            Location
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Remote, San Francisco, London"
            value={filters.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#38bdf8' },
              },
            }}
          />
        </Box>

        {/* Work Arrangement */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#cbd5e1', mb: 1 }}>
            Work Arrangement
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              aria-label="Work Arrangement"
              value={filters.workArrangement || ''}
              onChange={(e) => handleChange('workArrangement', e.target.value)}
              displayEmpty
              sx={{
                color: '#f8fafc',
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
              }}
            >
              <MenuItem value="">Any Arrangement</MenuItem>
              {WORK_ARRANGEMENTS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Employment Type */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#cbd5e1', mb: 1 }}>
            Employment Type
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              aria-label="Employment Type"
              value={filters.employmentType || ''}
              onChange={(e) => handleChange('employmentType', e.target.value)}
              displayEmpty
              sx={{
                color: '#f8fafc',
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
              }}
            >
              <MenuItem value="">Any Employment Type</MenuItem>
              {EMPLOYMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Experience Level */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#cbd5e1', mb: 1 }}>
            Experience Level
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              aria-label="Experience Level"
              value={filters.experienceLevel || ''}
              onChange={(e) => handleChange('experienceLevel', e.target.value)}
              displayEmpty
              sx={{
                color: '#f8fafc',
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
              }}
            >
              <MenuItem value="">Any Level</MenuItem>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <MenuItem key={lvl} value={lvl}>
                  {lvl}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Industry */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#cbd5e1', mb: 1 }}>
            Industry
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              aria-label="Industry"
              value={filters.industry || ''}
              onChange={(e) => handleChange('industry', e.target.value)}
              displayEmpty
              sx={{
                color: '#f8fafc',
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
              }}
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

        {/* Skills Tag Selector */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#cbd5e1', mb: 1 }}>
            Skills & Keywords
          </Typography>
          <Autocomplete
            multiple
            size="small"
            options={SUGGESTED_SKILLS}
            value={filters.skills || []}
            onChange={(_, newValue) => handleChange('skills', newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                  sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select or type skills..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f8fafc',
                    bgcolor: 'rgba(30, 41, 59, 0.8)',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#38bdf8' },
                  },
                }}
              />
            )}
          />
        </Box>
      </Box>

      {/* Footer Buttons */}
      <Box sx={{ pt: 3, display: 'flex', gap: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.1)', mt: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onResetFilters}
          startIcon={<RestartAltIcon fontSize="small" />}
          sx={{
            color: '#94a3b8',
            borderColor: '#334155',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': { borderColor: '#64748b', color: '#f8fafc' },
          }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            onApplyFilters();
            if (isDrawer) onClose();
          }}
          startIcon={<CheckIcon fontSize="small" />}
          sx={{
            bgcolor: '#38bdf8',
            color: '#0f172a',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': { bgcolor: '#0284c7' },
          }}
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );

  if (isDrawer) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        {content}
      </Drawer>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {content}
    </Paper>
  );
};

export default SearchFiltersSidebar;
