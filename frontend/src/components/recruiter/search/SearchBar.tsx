'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  InputAdornment,
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import CodeIcon from '@mui/icons-material/Code';
import GlassCard from '../../landing/GlassCard';

interface SearchBarProps {
  onSearch: (query: string, booleanMode: boolean, location?: string) => void;
  onSaveSearchClick: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onSaveSearchClick }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [booleanMode, setBooleanMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, booleanMode, location);
  };

  const handleBooleanExample = (expr: string) => {
    setQuery(expr);
    setBooleanMode(true);
    onSearch(expr, true, location);
  };

  return (
    <GlassCard sx={{ p: { xs: 2.5, md: 3 }, mb: 4 }}>
      <form onSubmit={handleSubmit}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            placeholder={
              booleanMode
                ? 'e.g. ("Go" OR "Golang") AND ("Backend Engineer") NOT "Junior"'
                : 'Search candidates by skills, job title, experience, or keywords...'
            }
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
            sx={{ minWidth: { xs: '100%', md: 240 } }}
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

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                py: 1.5,
                px: 3.5,
                borderRadius: '12px',
                fontWeight: 800,
                textTransform: 'none',
                minWidth: 140,
              }}
            >
              Search
            </Button>

            <Tooltip title="Save this search query & set alert notifications">
              <IconButton onClick={onSaveSearchClick} color="primary" sx={{ p: 1.5, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <BookmarkAddIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
          <FormControlLabel
            control={<Switch checked={booleanMode} onChange={(e) => setBooleanMode(e.target.checked)} color="primary" />}
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CodeIcon fontSize="small" color={booleanMode ? 'primary' : 'disabled'} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Boolean Search Mode (AND, OR, NOT)</span>
              </Stack>
            }
          />

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip label="Examples:" size="small" sx={{ bgcolor: 'transparent', fontWeight: 800 }} />
            <Chip
              label='("Go" OR "Golang") AND ("Backend")'
              size="small"
              variant="outlined"
              onClick={() => handleBooleanExample('("Go" OR "Golang") AND ("Backend")')}
              sx={{ fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'monospace' }}
            />
            <Chip
              label='("Facilities") AND ("Dubai") NOT "Junior"'
              size="small"
              variant="outlined"
              onClick={() => handleBooleanExample('("Facilities") AND ("Dubai") NOT "Junior"')}
              sx={{ fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'monospace' }}
            />
          </Stack>
        </Stack>
      </form>
    </GlassCard>
  );
};

export default SearchBar;
