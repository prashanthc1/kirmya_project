import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { MentorFilterParams, MentorshipFormat } from '../../features/mentorship/types';

interface MentorFiltersSidebarProps {
  filters: MentorFilterParams;
  onFilterChange: (filters: MentorFilterParams) => void;
  onReset: () => void;
  availableSkills?: string[];
  availableIndustries?: string[];
}

const DEFAULT_SKILLS = ['React', 'Python', 'System Architecture', 'TypeScript', 'Go', 'Leadership', 'PyTorch', 'Kubernetes'];
const DEFAULT_INDUSTRIES = ['All Industries', 'Artificial Intelligence', 'Fintech', 'Consumer Internet', 'Enterprise Software', 'Healthcare'];

export const MentorFiltersSidebar: React.FC<MentorFiltersSidebarProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableSkills = DEFAULT_SKILLS,
  availableIndustries = DEFAULT_INDUSTRIES,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleIndustryChange = (e: any) => {
    const val = e.target.value;
    onFilterChange({ ...filters, industry: val === 'All Industries' ? undefined : val });
  };

  const handleAvailabilityChange = (e: any) => {
    const val = e.target.value;
    onFilterChange({ ...filters, availability: val });
  };

  const handleExpChange = (_: Event, newValue: number | number[]) => {
    const [min_experience, max_experience] = newValue as number[];
    onFilterChange({ ...filters, min_experience, max_experience });
  };

  const toggleSkill = (skill: string) => {
    const current = filters.skills || [];
    const next = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    onFilterChange({ ...filters, skills: next });
  };

  const handleFormatChange = (format: MentorshipFormat) => {
    onFilterChange({
      ...filters,
      format: filters.format === format ? 'all' : format,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(255, 255, 255, 0.6)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterAltIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Filter Mentors
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Reset
        </Button>
      </Box>

      <Stack spacing={3}>
        {/* Search */}
        <TextField
          placeholder="Search name, title, skill..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            },
          }}
        />

        <Divider />

        {/* Industry Dropdown */}
        <FormControl fullWidth size="small">
          <InputLabel id="industry-label">Industry</InputLabel>
          <Select
            labelId="industry-label"
            label="Industry"
            value={filters.industry || 'All Industries'}
            onChange={handleIndustryChange}
            sx={{ borderRadius: '12px' }}
          >
            {availableIndustries.map((ind) => (
              <MenuItem key={ind} value={ind}>
                {ind}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Availability */}
        <FormControl fullWidth size="small">
          <InputLabel id="availability-label">Availability</InputLabel>
          <Select
            labelId="availability-label"
            label="Availability"
            value={filters.availability || 'all'}
            onChange={handleAvailabilityChange}
            sx={{ borderRadius: '12px' }}
          >
            <MenuItem value="all">All Availability</MenuItem>
            <MenuItem value="available">Available Now</MenuItem>
            <MenuItem value="busy">Limited Spots</MenuItem>
          </Select>
        </FormControl>

        <Divider />

        {/* Experience Slider */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Experience Range (Years)
          </Typography>
          <Box sx={{ px: 1, mt: 1 }}>
            <Slider
              value={[filters.min_experience || 0, filters.max_experience || 20]}
              onChange={handleExpChange}
              valueLabelDisplay="auto"
              min={0}
              max={25}
              sx={{ color: 'primary.main' }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {filters.min_experience || 0} yrs
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filters.max_experience || 20}+ yrs
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Mentorship Format */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Mentorship Format
          </Typography>
          <FormGroup>
            {[
              { id: 'one_on_one', label: '1-on-1 Sessions' },
              { id: 'async', label: 'Async Guidance' },
              { id: 'code_review', label: 'Code Review' },
              { id: 'group', label: 'Group Mentorship' },
            ].map((item) => (
              <FormControlLabel
                key={item.id}
                control={
                  <Checkbox
                    checked={filters.format === item.id}
                    onChange={() => handleFormatChange(item.id as MentorshipFormat)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{item.label}</Typography>}
              />
            ))}
          </FormGroup>
        </Box>

        <Divider />

        {/* Skills Filter */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 1.5 }}>
            Skills & Stack
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
            {availableSkills.map((skill) => {
              const isSelected = (filters.skills || []).includes(skill);
              return (
                <Chip
                  key={skill}
                  label={skill}
                  clickable
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => toggleSkill(skill)}
                  size="small"
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                />
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default MentorFiltersSidebar;
