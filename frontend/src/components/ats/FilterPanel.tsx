'use client';

import React from 'react';
import { Box, TextField, MenuItem, Stack, Button } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import GlassCard from '../landing/GlassCard';

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange }) => {
  const [jobId, setJobId] = React.useState('');
  const [stage, setStage] = React.useState('');

  const handleChange = (newJob: string, newStage: string) => {
    setJobId(newJob);
    setStage(newStage);
    onFilterChange({ jobId: newJob, stage: newStage });
  };

  return (
    <GlassCard sx={{ p: 2.5, mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField select label="Filter by Vacancy / Job" size="small" fullWidth value={jobId} onChange={(e) => handleChange(e.target.value, stage)}>
          <MenuItem value="">All Active Vacancies</MenuItem>
          <MenuItem value="11111111-1111-1111-1111-111111111111">Senior Microservices Engineer (Golang)</MenuItem>
          <MenuItem value="22222222-2222-2222-2222-222222222222">Senior Facilities Operations Manager</MenuItem>
        </TextField>

        <TextField select label="Filter by Stage" size="small" fullWidth value={stage} onChange={(e) => handleChange(jobId, e.target.value)}>
          <MenuItem value="">All Pipeline Stages</MenuItem>
          {['Applied', 'Screening', 'Shortlisted', 'Recruiter Review', 'Interview', 'Technical Round', 'Final Interview', 'Offer', 'Hired', 'Rejected'].map((st) => (
            <MenuItem key={st} value={st}>
              {st}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="outlined"
          startIcon={<FilterAltIcon />}
          onClick={() => handleChange('', '')}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, minWidth: 120 }}
        >
          Reset
        </Button>
      </Stack>
    </GlassCard>
  );
};

export default FilterPanel;
