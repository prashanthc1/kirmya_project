import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Stack,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { SearchHistoryItem } from '../../features/search/types';
import { tokens } from '../../theme/tokens';

export interface RecentSearchesManagerProps {
  history: SearchHistoryItem[];
  onSelectQuery?: (query: string, category?: string) => void;
  onSelectSearch?: (query: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  loading?: boolean;
}

export const RecentSearchesManager: React.FC<RecentSearchesManagerProps> = ({
  history,
  onSelectQuery,
  onSelectSearch,
  onDeleteItem,
  onClearAll,
  loading = false,
}) => {
  if (!history || history.length === 0) {
    return null;
  }

  const handleSelect = (item: SearchHistoryItem) => {
    if (onSelectQuery) {
      onSelectQuery(item.query, item.category_filter);
    } else if (onSelectSearch) {
      onSelectSearch(item.query);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${tokens.radius.lg}px`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HistoryIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Recent Searches
          </Typography>
          <Chip
            label={history.length}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }}
          />
        </Stack>

        <Tooltip title="Clear search history">
          <Button
            size="small"
            color="error"
            startIcon={<DeleteSweepIcon fontSize="small" />}
            onClick={onClearAll}
            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
          >
            Clear All
          </Button>
        </Tooltip>
      </Box>

      <Stack spacing={1}>
        {history.map((item) => (
          <Box
            key={item.id}
            onClick={() => handleSelect(item)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.25,
              borderRadius: `${tokens.radius.sm}px`,
              cursor: 'pointer',
              border: '1px solid transparent',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'divider',
              },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <SearchIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {item.query}
                </Typography>
                {item.category_filter && item.category_filter !== 'all' && (
                  <Typography variant="caption" color="text.secondary">
                    in {item.category_filter}
                  </Typography>
                )}
              </Box>
            </Stack>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item.id);
              }}
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default RecentSearchesManager;
