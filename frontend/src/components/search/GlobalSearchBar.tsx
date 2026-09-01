import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Autocomplete,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { SearchCategory, SearchHistoryItem, SearchSuggestion } from '../../features/search/types';
import { tokens } from '../../theme/tokens';

export interface GlobalSearchBarProps {
  value?: string;
  query?: string;
  onChange?: (val: string) => void;
  onQueryChange?: (val: string) => void;
  onSearch: (val?: string) => void;
  suggestions?: SearchSuggestion[];
  onSelectSuggestion?: (sug: SearchSuggestion) => void;
  history?: SearchHistoryItem[];
  loading?: boolean;
  onSelectHistory?: (q: string) => void;
  onDeleteHistoryItem?: (id: string) => void;
  onClearHistory?: () => void;
  placeholder?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  value,
  query: propQuery,
  onChange,
  onQueryChange,
  onSearch,
  suggestions = [],
  onSelectSuggestion,
  history = [],
  loading = false,
  onSelectHistory,
  onDeleteHistoryItem,
  onClearHistory,
  placeholder = 'Search People, Jobs, Companies, Communities, Courses, Events...',
}) => {
  const [historyAnchorEl, setHistoryAnchorEl] = useState<null | HTMLElement>(null);

  const currentQuery = value !== undefined ? value : propQuery || '';

  const handleTextChange = (val: string) => {
    if (onChange) onChange(val);
    if (onQueryChange) onQueryChange(val);
  };

  const getCategoryIcon = (category: SearchCategory) => {
    switch (category) {
      case 'people':
        return <PersonIcon fontSize="small" color="primary" />;
      case 'jobs':
        return <WorkIcon fontSize="small" color="success" />;
      case 'companies':
        return <BusinessIcon fontSize="small" color="secondary" />;
      case 'communities':
        return <GroupsIcon fontSize="small" color="warning" />;
      case 'courses':
        return <SchoolIcon fontSize="small" color="info" />;
      case 'events':
        return <EventIcon fontSize="small" color="action" />;
      default:
        return <SearchIcon fontSize="small" color="primary" />;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(currentQuery);
    }
  };

  const handleClear = () => {
    handleTextChange('');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
      }}
    >
      <Autocomplete
        freeSolo
        fullWidth
        options={suggestions}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.text)}
        inputValue={currentQuery}
        onInputChange={(_, val) => handleTextChange(val)}
        onChange={(_, val) => {
          if (typeof val === 'string') {
            handleTextChange(val);
            onSearch(val);
          } else if (val && typeof val === 'object') {
            if (onSelectSuggestion) {
              onSelectSuggestion(val);
            } else {
              handleTextChange(val.text);
              onSearch(val.text);
            }
          }
        }}
        renderOption={(props, option) => {
          const { key, ...restProps } = props as any;
          return (
            <Box
              component="li"
              key={key || option.text}
              {...restProps}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                cursor: 'pointer',
              }}
            >
              {getCategoryIcon(option.category)}
              <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600 }}>
                {option.text}
              </Typography>
              <Chip
                label={option.category}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 22,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              />
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            size="medium"
            onKeyDown={handleKeyDown}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {currentQuery && (
                    <IconButton
                      aria-label="clear search input"
                      size="small"
                      onClick={handleClear}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                  {history.length > 0 && (
                    <IconButton
                      aria-label="recent search history dropdown"
                      size="small"
                      onClick={(e) => setHistoryAnchorEl(e.currentTarget)}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: `${tokens.radius.sm}px`,
              },
            }}
          />
        )}
      />

      <Button
        variant="contained"
        onClick={() => onSearch(currentQuery)}
        disabled={loading}
        startIcon={<SearchIcon />}
        sx={{
          fontWeight: 700,
          px: 3.5,
          py: 1.25,
          borderRadius: `${tokens.radius.sm}px`,
          minWidth: 120,
          textTransform: 'none',
        }}
      >
        Search
      </Button>

      {/* Recent History Menu */}
      <Menu
        anchorEl={historyAnchorEl}
        open={Boolean(historyAnchorEl)}
        onClose={() => setHistoryAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: `${tokens.radius.md}px`,
            minWidth: 260,
          },
        }}
      >
        <Box sx={{ p: 1.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
            Recent Searches
          </Typography>
          {onClearHistory && (
            <Button
              size="small"
              onClick={() => {
                onClearHistory();
                setHistoryAnchorEl(null);
              }}
              sx={{ fontSize: '0.75rem', textTransform: 'none' }}
            >
              Clear All
            </Button>
          )}
        </Box>

        {history.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => {
              handleTextChange(item.query);
              onSearch(item.query);
              setHistoryAnchorEl(null);
            }}
            sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.query}
              </Typography>
            </Box>

            {onDeleteHistoryItem && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteHistoryItem(item.id);
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default GlobalSearchBar;
