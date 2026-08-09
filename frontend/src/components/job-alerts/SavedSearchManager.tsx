'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Stack,
  Tooltip,
} from '@mui/material';
import SavedSearchIcon from '@mui/icons-material/SavedSearch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { SavedSearch } from '@/features/job-alerts/types';

interface SavedSearchManagerProps {
  searches: SavedSearch[];
  onCreateSearch: (search: Partial<SavedSearch>) => void;
  onUpdateSearch: (id: string, search: Partial<SavedSearch>) => void;
  onDeleteSearch: (id: string) => void;
  onConvertToAlert?: (search: SavedSearch) => void;
}

export const SavedSearchManager: React.FC<SavedSearchManagerProps> = ({
  searches,
  onCreateSearch,
  onUpdateSearch,
  onDeleteSearch,
  onConvertToAlert,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [queryText, setQueryText] = useState('');

  const handleCreate = () => {
    onCreateSearch({
      name: name || 'Saved Job Query',
      query_text: queryText,
      auto_alert: false,
    });
    setOpenModal(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Saved Search Queries
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Save New Search
        </Button>
      </Box>

      <Grid container spacing={3}>
        {searches.map((search) => (
          <Grid item xs={12} md={6} key={search.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SavedSearchIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                      {search.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Saved on {new Date(search.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Duplicate Query">
                    <IconButton size="small" onClick={() => onCreateSearch({ name: `${search.name} (Copy)`, query_text: search.query_text })}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Search">
                    <IconButton size="small" onClick={() => onDeleteSearch(search.id)} sx={{ color: 'error.main' }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'monospace' }}>
                Query: &ldquo;{search.query_text}&rdquo;
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Switch
                    checked={search.auto_alert}
                    onChange={(e) => onUpdateSearch(search.id, { auto_alert: e.target.checked })}
                    size="small"
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Auto-Alert Notifications
                  </Typography>
                </Box>

                {onConvertToAlert && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<NotificationsActiveIcon />}
                    onClick={() => onConvertToAlert(search)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Convert to Alert
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}

        {searches.length === 0 && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, background: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                No saved searches
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Save Search Query</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Search Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Staff Golang NYC" />
            <TextField label="Query Keywords" fullWidth value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Golang, PostgreSQL, Microservices" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Save Search</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
