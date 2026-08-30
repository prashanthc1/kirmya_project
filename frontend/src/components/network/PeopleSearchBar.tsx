'use client';

import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import { tokens } from '../../theme/tokens';

interface PeopleSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export const PeopleSearchBar: React.FC<PeopleSearchBarProps> = ({
  onSearch,
  placeholder = 'Search professionals by name, title, company, or skills...',
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

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        variant="outlined"
        inputProps={{
          'aria-label': 'Search professionals',
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                aria-label="Clear search query"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: {
            borderRadius: `${tokens.radius.md}px`,
            bgcolor: 'background.paper',
          },
        }}
      />
    </Box>
  );
};

export default PeopleSearchBar;
