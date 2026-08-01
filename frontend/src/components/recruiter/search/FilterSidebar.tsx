'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox,
  Stack,
  Button,
  Autocomplete,
  Chip,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface FilterSidebarProps {
  onApplyFilters: (filters: any) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ onApplyFilters }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [expYears, setExpYears] = useState<number[]>([2, 15]);
  const [currentTitle, setCurrentTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Golang', 'PostgreSQL']);
  const [optionalSkills, setOptionalSkills] = useState<string[]>(['Docker']);
  const [country, setCountry] = useState('United Arab Emirates');
  const [city, setCity] = useState('Dubai');
  const [remote, setRemote] = useState('Hybrid');
  const [openToWork, setOpenToWork] = useState(true);
  const [availability, setAvailability] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [degree, setDegree] = useState('');
  const [certification, setCertification] = useState('');
  const [language, setLanguage] = useState('');

  const handleReset = () => {
    setExpYears([0, 20]);
    setCurrentTitle('');
    setIndustry('');
    setExperienceLevel('');
    setRequiredSkills([]);
    setOptionalSkills([]);
    setCountry('');
    setCity('');
    setRemote('');
    setOpenToWork(false);
    setAvailability('');
    setEmploymentType('');
    setDegree('');
    setCertification('');
    setLanguage('');
    onApplyFilters({});
  };

  const handleApply = () => {
    onApplyFilters({
      minYearsExp: expYears[0],
      maxYearsExp: expYears[1],
      title: currentTitle,
      industry,
      experienceLevel,
      requiredSkills,
      optionalSkills,
      country,
      city,
      remote,
      openToWork,
      availability,
      employmentType,
      degree,
      certification,
      language,
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        p: 2.5,
        borderRadius: '16px',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterAltIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Advanced Filters
          </Typography>
        </Stack>
        <Button size="small" startIcon={<RestartAltIcon />} onClick={handleReset} sx={{ fontWeight: 700 }}>
          Reset
        </Button>
      </Stack>

      {/* Accordion 1: Professional Information */}
      <Accordion defaultExpanded elevation={0} sx={{ bgcolor: 'transparent' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Professional Info &amp; Experience
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="Current Job Title" size="small" fullWidth value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} />
            <TextField select label="Industry" size="small" fullWidth value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {['Software & Technology', 'Facilities & Real Estate', 'Finance & Banking', 'Healthcare', 'Engineering'].map((i) => (
                <MenuItem key={i} value={i}>
                  {i}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Experience Level" size="small" fullWidth value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
              {['Entry Level (0-2 Yrs)', 'Mid Level (2-5 Yrs)', 'Senior Level (5+ Yrs)', 'Director / Executive'].map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            </TextField>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Years of Experience: {expYears[0]} - {expYears[1]} Years
              </Typography>
              <Slider value={expYears} onChange={(_, val) => setExpYears(val as number[])} valueLabelDisplay="auto" min={0} max={25} size="small" />
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Accordion 2: Skills */}
      <Accordion defaultExpanded elevation={0} sx={{ bgcolor: 'transparent' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Skills &amp; Tech Stack
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Autocomplete
              multiple
              options={['Golang', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'Kubernetes', 'SLA Auditing', 'HVAC', 'Python', 'PyTorch']}
              value={requiredSkills}
              onChange={(_, val) => setRequiredSkills(val)}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />)
              }
              renderInput={(params) => <TextField {...params} label="Required Skills" size="small" />}
            />
            <Autocomplete
              multiple
              options={['AWS', 'gRPC', 'Kafka', 'Redis', 'Microservices']}
              value={optionalSkills}
              onChange={(_, val) => setOptionalSkills(val)}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />)
              }
              renderInput={(params) => <TextField {...params} label="Optional Skills" size="small" />}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Accordion 3: Location */}
      <Accordion defaultExpanded elevation={0} sx={{ bgcolor: 'transparent' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Location &amp; Remote
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="Country" size="small" fullWidth value={country} onChange={(e) => setCountry(e.target.value)} />
            <TextField label="City" size="small" fullWidth value={city} onChange={(e) => setCity(e.target.value)} />
            <TextField select label="Work Arrangement" size="small" fullWidth value={remote} onChange={(e) => setRemote(e.target.value)}>
              {['On-site', 'Hybrid', 'Remote'].map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Accordion 4: Career Preferences */}
      <Accordion elevation={0} sx={{ bgcolor: 'transparent' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Career &amp; Availability
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <FormControlLabel
              control={<Checkbox checked={openToWork} onChange={(e) => setOpenToWork(e.target.checked)} color="primary" />}
              label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Open To Work Only</Typography>}
            />
            <TextField select label="Availability" size="small" fullWidth value={availability} onChange={(e) => setAvailability(e.target.value)}>
              {['Immediate (Layoff Support)', '1-2 Weeks', '1 Month', '3 Months'].map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Employment Type" size="small" fullWidth value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              {['Full-time', 'Contract', 'Freelance', 'Part-time'].map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Accordion 5: Education & Certifications */}
      <Accordion elevation={0} sx={{ bgcolor: 'transparent' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Education &amp; Certifications
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="Degree" size="small" fullWidth value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. Master's in CS" />
            <TextField label="Certification" size="small" fullWidth value={certification} onChange={(e) => setCertification(e.target.value)} placeholder="e.g. AWS Solutions Architect" />
            <TextField label="Language" size="small" fullWidth value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. Arabic, English" />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Button
        variant="contained"
        fullWidth
        onClick={handleApply}
        sx={{ mt: 2.5, py: 1.2, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
      >
        Apply Search Filters
      </Button>
    </Box>
  );
};

export default FilterSidebar;
