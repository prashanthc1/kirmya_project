import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  Tooltip,
  Divider,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { SearchHistoryItem } from '../../features/search/types';

export interface RecentSearchesManagerProps {
  history: SearchHistoryItem[];
  onSelectSearch: (query: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  loading?: boolean;
}

export const RecentSearchesManager: React.FC<RecentSearchesManagerProps> = ({
  history,
  onSelectSearch,
  onDeleteItem,
  onClearAll,
  loading = false,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        bgcolor: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon fontSize="small" sx={{ color: '#38bdf8' }} />
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f8fafc' }}>
            Recent Searches
          </Typography>
          <Chip
            label={history.length}
            size="small"
            sx={{
              bgcolor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: 'bold',
              height: 20,
              fontSize: '0.7rem',
            }}
          />
        </Box>
        <Button
          size="small"
          onClick={onClearAll}
          disabled={loading}
          startIcon={<DeleteSweepIcon fontSize="small" />}
          sx={{
            color: '#ef4444',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
          }}
        >
          Clear History
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 1.5 }} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {history.map((item) => (
          <Chip
            key={item.id}
            icon={<SearchIcon fontSize="small" style={{ color: '#38bdf8' }} />}
            label={item.query}
            onClick={() => onSelectSearch(item.query)}
            onDelete={() => onDeleteItem(item.id)}
            deleteIcon={
              <Tooltip title="Remove item">
                <CloseIcon style={{ color: '#94a3b8', fontSize: '0.9rem' }} />
              </Tooltip>
            }
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.7)',
              color: '#38bdf8',
              border: '1px solid #334155',
              cursor: 'pointer',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'rgba(56, 189, 248, 0.15)',
                borderColor: '#38bdf8',
              },
              '& .MuiChip-deleteIcon:hover': {
                color: '#ef4444 !important',
              },
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default RecentSearchesManager;
