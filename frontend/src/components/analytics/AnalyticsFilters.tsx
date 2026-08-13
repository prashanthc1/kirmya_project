'use client';

import React from 'react';
import { Box, Button, ButtonGroup, FormControl, Select, MenuItem, InputLabel } from '@mui/material';

interface AnalyticsFiltersProps {
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  orgFilter?: string;
  onOrgFilterChange?: (org: string) => void;
}

export default function AnalyticsFilters({
  dateRange,
  onDateRangeChange,
  orgFilter = 'all',
  onOrgFilterChange,
}: AnalyticsFiltersProps) {
  const ranges = ['Today', '7D', '30D', '90D', '12M', 'All Time'];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
      <ButtonGroup variant="outlined" size="small" sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
        {ranges.map((r) => (
          <Button
            key={r}
            onClick={() => onDateRangeChange(r)}
            sx={{
              color: dateRange === r ? '#fff' : '#94a3b8',
              bgcolor: dateRange === r ? '#0284c7' : 'transparent',
              fontWeight: 'bold',
              '&:hover': { bgcolor: dateRange === r ? '#0284c7' : '#334155' },
            }}
          >
            {r}
          </Button>
        ))}
      </ButtonGroup>

      {onOrgFilterChange && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: '#94a3b8' }}>Filter Scope</InputLabel>
          <Select
            value={orgFilter}
            label="Filter Scope"
            onChange={(e) => onOrgFilterChange(e.target.value)}
            sx={{ color: '#fff', bgcolor: '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
          >
            <MenuItem value="all">All Subsystems</MenuItem>
            <MenuItem value="engineering">Engineering</MenuItem>
            <MenuItem value="product">Product & AI</MenuItem>
            <MenuItem value="recruitment">Recruitment</MenuItem>
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
