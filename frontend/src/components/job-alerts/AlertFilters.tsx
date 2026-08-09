'use client';

import React from 'react';
import { Box, Paper, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

interface AlertFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  frequencyFilter: string;
  onFrequencyChange: (freq: string) => void;
}

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  frequencyFilter,
  onFrequencyChange,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          fullWidth
          size="small"
          placeholder="Filter job alerts by title, keywords, location..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.02)',
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="alert-status-label">Status</InputLabel>
          <Select
            labelId="alert-status-label"
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusChange(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon fontSize="small" />
              </InputAdornment>
            }
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="ALL">All Alerts</MenuItem>
            <MenuItem value="ACTIVE">Active Only</MenuItem>
            <MenuItem value="PAUSED">Paused Only</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="alert-freq-label">Frequency</InputLabel>
          <Select
            labelId="alert-freq-label"
            value={frequencyFilter}
            label="Frequency"
            onChange={(e) => onFrequencyChange(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="ALL">All Frequencies</MenuItem>
            <MenuItem value="Immediately">Immediately</MenuItem>
            <MenuItem value="Every Hour">Every Hour</MenuItem>
            <MenuItem value="Daily">Daily</MenuItem>
            <MenuItem value="Weekly">Weekly</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Paper>
  );
};
