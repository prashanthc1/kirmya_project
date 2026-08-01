'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  Chip,
  InputAdornment,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import GlassCard from '../landing/GlassCard';

interface CompanySearchProps {
  onSearch: (query: string, location?: string, industry?: string) => void;
}

export const CompanySearch: React.FC<CompanySearchProps> = ({ onSearch }) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, location);
  };

  const handleQuickChip = (term: string) => {
    setQuery(term);
    onSearch(term, location);
  };

  return (
    <GlassCard sx={{ p: { xs: 2.5, md: 3.5 }, mb: 4 }}>
      <form onSubmit={handleSearchSubmit}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            placeholder="Search by Company Name, Keyword or Industry..."
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
            placeholder="Country or City (e.g. Dubai, UAE)..."
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
              py: 1.6,
              px: 4,
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              minWidth: 160,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            }}
          >
            Find Companies
          </Button>
        </Stack>
      </form>

      {/* Quick Search Chips */}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 2.5 }}>
        <Chip
          icon={<BusinessIcon fontSize="small" />}
          label="Trending Searches:"
          size="small"
          sx={{ bgcolor: 'transparent', fontWeight: 800, color: 'text.secondary' }}
        />
        {['Emaar Properties', 'Google UAE', 'Microsoft Dubai', 'Facilities Management', 'Oil & Gas', 'Aviation'].map(
          (chip) => (
            <Chip
              key={chip}
              label={chip}
              size="small"
              variant="outlined"
              onClick={() => handleQuickChip(chip)}
              sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' } }}
            />
          )
        )}
      </Stack>
    </GlassCard>
  );
};

export default CompanySearch;
