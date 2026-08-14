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

export interface GlobalSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query?: string) => void;
  suggestions?: SearchSuggestion[];
  history?: SearchHistoryItem[];
  loading?: boolean;
  onSelectHistory?: (query: string) => void;
  onDeleteHistoryItem?: (id: string) => void;
  onClearHistory?: () => void;
  placeholder?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  suggestions = [],
  history = [],
  loading = false,
  onSelectHistory,
  onDeleteHistoryItem,
  onClearHistory,
  placeholder = 'Search People, Jobs, Companies, Communities, Courses, Events...',
}) => {
  const [historyAnchorEl, setHistoryAnchorEl] = useState<null | HTMLElement>(null);

  const getCategoryIcon = (category: SearchCategory) => {
    switch (category) {
      case 'people':
        return <PersonIcon fontSize="small" sx={{ color: '#38bdf8' }} />;
      case 'jobs':
        return <WorkIcon fontSize="small" sx={{ color: '#10b981' }} />;
      case 'companies':
        return <BusinessIcon fontSize="small" sx={{ color: '#a855f7' }} />;
      case 'communities':
        return <GroupsIcon fontSize="small" sx={{ color: '#f59e0b' }} />;
      case 'courses':
        return <SchoolIcon fontSize="small" sx={{ color: '#ec4899' }} />;
      case 'events':
        return <EventIcon fontSize="small" sx={{ color: '#6366f1' }} />;
      default:
        return <SearchIcon fontSize="small" sx={{ color: '#38bdf8' }} />;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  const handleClear = () => {
    onQueryChange('');
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        bgcolor: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}
    >
      <Autocomplete
        freeSolo
        fullWidth
        options={suggestions}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.text)}
        inputValue={query}
        onInputChange={(_, value) => onQueryChange(value)}
        onChange={(_, value) => {
          if (typeof value === 'string') {
            onQueryChange(value);
            onSearch(value);
          } else if (value && typeof value === 'object') {
            onQueryChange(value.text);
            onSearch(value.text);
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
                p: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' },
              }}
            >
              {getCategoryIcon(option.category)}
              <Typography variant="body2" sx={{ color: '#f8fafc', flexGrow: 1 }}>
                {option.text}
              </Typography>
              <Chip
                label={option.category}
                size="small"
                sx={{
                  bgcolor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontSize: '0.7rem',
                  height: 20,
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                }}
              />
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            size="small"
            onKeyDown={handleKeyDown}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#38bdf8' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {query && (
                    <IconButton
                      aria-label="clear search input"
                      size="small"
                      onClick={handleClear}
                      sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                  {history.length > 0 && (
                    <IconButton
                      aria-label="recent search history dropdown"
                      size="small"
                      onClick={(e) => setHistoryAnchorEl(e.currentTarget)}
                      sx={{ color: historyAnchorEl ? '#38bdf8' : '#94a3b8', '&:hover': { color: '#38bdf8' } }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(56, 189, 248, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
              },
            }}
          />
        )}
      />

      <Button
        variant="contained"
        onClick={() => onSearch(query)}
        disabled={loading}
        startIcon={<SearchIcon />}
        sx={{
          background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
          color: '#0f172a',
          fontWeight: 'bold',
          px: 3,
          py: 1,
          borderRadius: 2,
          minWidth: 120,
          textTransform: 'none',
          boxShadow: '0 4px 14px 0 rgba(56, 189, 248, 0.39)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
          },
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
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 2,
            minWidth: 260,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          },
        }}
      >
        <Box sx={{ p: 1.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" fontWeight="bold" sx={{ color: '#94a3b8', textTransform: 'uppercase' }}>
            Recent Searches
          </Typography>
          {onClearHistory && (
            <Button
              size="small"
              onClick={() => {
                onClearHistory();
                setHistoryAnchorEl(null);
              }}
              sx={{ color: '#ef4444', fontSize: '0.75rem', p: 0, minWidth: 'auto', textTransform: 'none' }}
            >
              Clear all
            </Button>
          )}
        </Box>
        {history.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => {
              onQueryChange(item.query);
              if (onSelectHistory) onSelectHistory(item.query);
              else onSearch(item.query);
              setHistoryAnchorEl(null);
            }}
            sx={{
              display: 'flex',
              justify: 'space-between',
              py: 1,
              '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon fontSize="small" sx={{ color: '#94a3b8' }} />
              <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                {item.query}
              </Typography>
            </Box>
            {onDeleteHistoryItem && (
              <IconButton
                size="small"
                aria-label={`delete ${item.query} from history`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteHistoryItem(item.id);
                }}
                sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default GlobalSearchBar;
