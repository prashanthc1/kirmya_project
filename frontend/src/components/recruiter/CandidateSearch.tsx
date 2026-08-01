'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Stack, InputAdornment, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GlassCard from '../landing/GlassCard';

interface CandidateSearchProps {
  onSearch: (query: string, location?: string) => void;
}

export const CandidateSearch: React.FC<CandidateSearchProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, location);
  };

  return (
    <GlassCard sx={{ p: 3, mb: 4 }}>
      <form onSubmit={handleSubmit}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            placeholder="Search candidates by name, job title, skills..."
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            placeholder="Location (e.g. Dubai, UAE)..."
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon sx={{ color: '#ec4899' }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              minWidth: 160,
            }}
          >
            Find Talent
          </Button>
        </Stack>
      </form>

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
        <Chip label="Popular Searches:" size="small" sx={{ bgcolor: 'transparent', fontWeight: 800 }} />
        {['Golang Engineers', 'Facilities Directors', 'React Developers', 'Layoff Support Talent', 'Immediate Availability'].map((chip) => (
          <Chip
            key={chip}
            label={chip}
            size="small"
            variant="outlined"
            onClick={() => {
              setQuery(chip);
              onSearch(chip, location);
            }}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
        ))}
      </Stack>
    </GlassCard>
  );
};

export default CandidateSearch;
