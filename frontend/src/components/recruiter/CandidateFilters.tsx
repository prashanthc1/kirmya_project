'use client';

import React from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export interface CandidateSearchFilters {
  keyword: string;
  jobTitle: string;
  skills: string[];
  minExperience: number;
  maxExperience: number;
  industry: string;
  location: string;
  education: string;
  certifications: string[];
  languages: string[];
  currentCompany: string;
  previousCompany: string;
  availability: string;
  openToWorkOnly: boolean;
  remotePreference: string;
  salaryMin: number;
  salaryMax: number;
}

interface Props {
  filters: CandidateSearchFilters;
  onChange: (filters: CandidateSearchFilters) => void;
  onReset: () => void;
}

const skillSuggestions = [
  'Golang',
  'React',
  'TypeScript',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'AWS',
  'Facilities Management',
  'HVAC',
  'SLA Auditing',
  'Python',
  'LLMs',
];

const industries = [
  'All Industries',
  'Software & IT Services',
  'Real Estate & Facilities',
  'Financial Technology',
  'Healthcare & Biotech',
  'E-Commerce & Retail',
];

const educationLevels = [
  'Any Education',
  "Bachelor's Degree",
  "Master's Degree",
  'Ph.D. / Doctorate',
  'Diploma / Certificate',
];

export const CandidateFilters: React.FC<Props> = ({ filters, onChange, onReset }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const update = (field: keyof CandidateSearchFilters, val: any) => {
    onChange({ ...filters, [field]: val });
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '20px',
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" /> Advanced Candidate Filters
        </Typography>
        <Button startIcon={<RestartAltIcon />} size="small" onClick={onReset}>
          Reset
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Candidate Name / Keyword"
            value={filters.keyword}
            onChange={(e) => update('keyword', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Job Title / Role"
            value={filters.jobTitle}
            onChange={(e) => update('jobTitle', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Location / Country"
            value={filters.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            multiple
            size="small"
            options={skillSuggestions}
            value={filters.skills}
            onChange={(_, val) => update('skills', val)}
            freeSolo
            renderTags={(val, getTagProps) =>
              val.map((opt, i) => <Chip label={opt} size="small" color="primary" {...getTagProps({ index: i })} key={opt} />)
            }
            renderInput={(params) => <TextField {...params} label="Top Required Skills" placeholder="Search skills..." />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            select
            size="small"
            label="Industry Sector"
            value={filters.industry}
            onChange={(e) => update('industry', e.target.value)}
          >
            {industries.map((ind) => (
              <MenuItem key={ind} value={ind}>
                {ind}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            select
            size="small"
            label="Education Level"
            value={filters.education}
            onChange={(e) => update('education', e.target.value)}
          >
            {educationLevels.map((ed) => (
              <MenuItem key={ed} value={ed}>
                {ed}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Accordion sx={{ bgcolor: 'transparent', boxShadow: 'none', mt: 1.5, '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
            More Filters (Companies, Experience, Salary &amp; Work Type)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Current Company"
                value={filters.currentCompany}
                onChange={(e) => update('currentCompany', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Previous Company"
                value={filters.previousCompany}
                onChange={(e) => update('previousCompany', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Remote Preference"
                value={filters.remotePreference}
                onChange={(e) => update('remotePreference', e.target.value)}
              >
                {['Any', 'Remote Only', 'Hybrid Preferred', 'On-site'].map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Availability"
                value={filters.availability}
                onChange={(e) => update('availability', e.target.value)}
              >
                {['Any', 'Immediate', '1-2 Weeks', '1 Month', 'Serving Notice'].map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Experience Range: {filters.minExperience} - {filters.maxExperience} Years
              </Typography>
              <Slider
                value={[filters.minExperience, filters.maxExperience]}
                onChange={(_, val: any) => {
                  update('minExperience', val[0]);
                  update('maxExperience', val[1]);
                }}
                valueLabelDisplay="auto"
                min={0}
                max={25}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.openToWorkOnly}
                    onChange={(e) => update('openToWorkOnly', e.target.checked)}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 700 }}>"Open To Work" candidates only</Typography>}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CandidateFilters;
