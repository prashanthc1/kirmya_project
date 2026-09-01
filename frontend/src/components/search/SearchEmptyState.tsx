import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { tokens } from '../../theme/tokens';

export interface SearchEmptyStateProps {
  query?: string;
  onSelectKeyword?: (keyword: string) => void;
  onResetFilters?: () => void;
  onClear?: () => void;
  hasActiveFilters?: boolean;
}

const SUGGESTED_KEYWORDS = [
  'Go Backend Architect',
  'Full-Stack Developer',
  'React Architect',
  'PostgreSQL Engineer',
  'Cloud Infrastructure',
  'Distributed Systems',
];

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  query,
  onSelectKeyword,
  onResetFilters,
  onClear,
  hasActiveFilters = false,
}) => {
  const handleClear = () => {
    if (onClear) onClear();
    if (onResetFilters) onResetFilters();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 5 },
        textAlign: 'center',
        bgcolor: 'background.paper',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: `${tokens.radius.lg}px`,
        my: 2,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: `${tokens.radius.md}px`,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <SearchOffIcon color="action" sx={{ fontSize: 32 }} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
        {query ? `No matching results for "${query}"` : 'No search results found'}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', mb: 3 }}>
        Check your spelling, try broader keywords, or reset active filters to explore more content across Kirmya.
      </Typography>

      {handleClear && (
        <Box sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={handleClear}
            sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
          >
            Clear Search & Filters
          </Button>
        </Box>
      )}

      {onSelectKeyword && (
        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 1.5 }}>
            <LightbulbIcon fontSize="small" color="warning" />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Suggested Searches
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ gap: 1 }}>
            {SUGGESTED_KEYWORDS.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                size="small"
                variant="outlined"
                onClick={() => onSelectKeyword(kw)}
                sx={{
                  borderRadius: `${tokens.radius.sm}px`,
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default SearchEmptyState;
