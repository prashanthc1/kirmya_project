'use client';

import React from 'react';
import { Paper, Stack, TextField, MenuItem, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';

interface InterviewPrepFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (diff: string) => void;
}

export const InterviewPrepFilterBar: React.FC<InterviewPrepFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 3.5,
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          placeholder="Search questions by keyword or topic..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#94A3B8' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              borderRadius: 2.5,
              bgcolor: 'rgba(15, 23, 42, 0.5)',
            },
          }}
        />

        <TextField
          select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as any)}
          sx={{
            minWidth: 160,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              borderRadius: 2.5,
              bgcolor: 'rgba(15, 23, 42, 0.5)',
            },
          }}
        >
          <MenuItem value="ALL">All Categories</MenuItem>
          <MenuItem value="Behavioral">Behavioral</MenuItem>
          <MenuItem value="Technical">Technical</MenuItem>
          <MenuItem value="Situational">Situational</MenuItem>
          <MenuItem value="Leadership">Leadership</MenuItem>
          <MenuItem value="General">General</MenuItem>
        </TextField>

        <TextField
          select
          value={selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value as any)}
          sx={{
            minWidth: 150,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              borderRadius: 2.5,
              bgcolor: 'rgba(15, 23, 42, 0.5)',
            },
          }}
        >
          <MenuItem value="ALL">All Difficulties</MenuItem>
          <MenuItem value="Beginner">Beginner</MenuItem>
          <MenuItem value="Intermediate">Intermediate</MenuItem>
          <MenuItem value="Advanced">Advanced</MenuItem>
          <MenuItem value="Expert">Expert</MenuItem>
        </TextField>
      </Stack>
    </Paper>
  );
};
