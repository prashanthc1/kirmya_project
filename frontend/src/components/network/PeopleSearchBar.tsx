'use client';

import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface PeopleSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export const PeopleSearchBar: React.FC<PeopleSearchBarProps> = ({
  onSearch,
  placeholder = 'Search by name, headline, company, or skills...',
  initialValue = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // Debounced search trigger (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, onSearch]);

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="primary" />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { borderRadius: '16px', bgcolor: 'background.paper' },
        }}
      />
    </Box>
  );
};

export default PeopleSearchBar;
