import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export interface SearchEmptyStateProps {
  query?: string;
  onSelectKeyword?: (keyword: string) => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

const SUGGESTED_KEYWORDS = [
  'Senior Go Backend Architect',
  'Full-Stack Developer',
  'React Architect',
  'PostgreSQL Engineer',
  'Stripe Global Jobs',
  'Go Guild Community',
];

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  query,
  onSelectKeyword,
  onResetFilters,
  hasActiveFilters = false,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 5,
        textAlign: 'center',
        bgcolor: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: 4,
        my: 4,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <SearchOffIcon sx={{ fontSize: 38, color: '#38bdf8' }} />
      </Box>

      <Typography variant="h5" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
        {query ? `No results found for "${query}"` : 'No search results found'}
      </Typography>

      <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 480, mx: 'auto', mb: 3 }}>
        We couldn't find any matches. Try adjusting your search query, clearing specific filters, or choosing one of our popular recommended topics below.
      </Typography>

      {hasActiveFilters && onResetFilters && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={onResetFilters}
            startIcon={<RestartAltIcon />}
            sx={{
              color: '#38bdf8',
              borderColor: '#38bdf8',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' },
            }}
          >
            Reset Active Filters
          </Button>
        </Box>
      )}

      {/* Suggested Keywords Section */}
      <Box sx={{ maxWidth: 600, mx: 'auto', pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          <LightbulbIcon fontSize="small" sx={{ color: '#f59e0b' }} />
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#cbd5e1' }}>
            Try searching for these trending keywords:
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
          {SUGGESTED_KEYWORDS.map((kw) => (
            <Chip
              key={kw}
              label={kw}
              onClick={() => onSelectKeyword && onSelectKeyword(kw)}
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                color: '#38bdf8',
                border: '1px solid #334155',
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 'bold',
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default SearchEmptyState;
