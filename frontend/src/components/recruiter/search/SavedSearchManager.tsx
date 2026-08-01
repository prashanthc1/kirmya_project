'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Paper,
  IconButton,
  Chip,
  Box,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SavedSearchDTO } from '../../../features/recruiter/search/types';
import { candidateSearchApi } from '../../../features/recruiter/search/api';

interface SavedSearchManagerProps {
  open: boolean;
  onClose: () => void;
  savedSearches: SavedSearchDTO[];
  onRefresh: () => void;
  onRunSearch: (query: string, filters: any) => void;
}

export const SavedSearchManager: React.FC<SavedSearchManagerProps> = ({
  open,
  onClose,
  savedSearches,
  onRefresh,
  onRunSearch,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [searchName, setSearchName] = useState('');
  const [frequency, setFrequency] = useState('Daily');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;
    try {
      await candidateSearchApi.createSavedSearch({
        search_name: searchName,
        alert_frequency: frequency,
      });
      setSearchName('');
      onRefresh();
    } catch {
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await candidateSearchApi.deleteSavedSearch(id);
      onRefresh();
    } catch {
      onRefresh();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>
        Saved Searches &amp; Talent Alert Subscriptions
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Form to Save Current Search */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
            Save Active Search Parameters
          </Typography>

          <form onSubmit={handleCreate}>
            <Stack spacing={2}>
              <TextField
                label="Search Name *"
                size="small"
                fullWidth
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g. Senior Golang Engineers (Dubai)"
              />

              <TextField select label="Alert Notification Frequency" size="small" fullWidth value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <MenuItem value="Daily">Notify Daily</MenuItem>
                <MenuItem value="Weekly">Notify Weekly</MenuItem>
                <MenuItem value="Immediately">Notify Immediately</MenuItem>
                <MenuItem value="Off">No Alerts (Save Query Only)</MenuItem>
              </TextField>

              <Button type="submit" variant="contained" startIcon={<BookmarkIcon />} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', py: 1 }}>
                Save Search Alert
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Existing Saved Searches */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
          Your Active Saved Searches ({savedSearches.length})
        </Typography>

        <Stack spacing={1.5}>
          {savedSearches.map((s) => (
            <Paper
              key={s.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {s.search_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Query: "{s.query || 'All Filters'}"
                </Typography>
                <Chip label={`Alerts: ${s.alert_frequency}`} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
              </Box>

              <Stack direction="row" spacing={1}>
                <IconButton color="primary" onClick={() => onRunSearch(s.query, s.filters)}>
                  <PlayArrowIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(s.id)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default SavedSearchManager;
