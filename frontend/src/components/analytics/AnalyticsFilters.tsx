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
      <ButtonGroup variant="outlined" size="small" sx={{ bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        {ranges.map((r) => (
          <Button
            key={r}
            onClick={() => onDateRangeChange(r)}
            sx={{
              color: dateRange === r ? "primary.contrastText" : "text.secondary",
              bgcolor: dateRange === r ? "primary.main" : 'transparent',
              fontWeight: 'bold',
              '&:hover': { bgcolor: dateRange === r ? "primary.main" : "action.hover" },
            }}
          >
            {r}
          </Button>
        ))}
      </ButtonGroup>

      {onOrgFilterChange && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: "text.secondary" }}>Filter Scope</InputLabel>
          <Select
            value={orgFilter}
            label="Filter Scope"
            onChange={(e) => onOrgFilterChange(e.target.value)}
            sx={{ color: "text.primary", bgcolor: "background.paper", '& .MuiOutlinedInput-notchedOutline': { borderColor: "divider" } }}
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
