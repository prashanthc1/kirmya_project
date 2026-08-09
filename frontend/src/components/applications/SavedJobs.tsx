'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Button,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material';
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import { SavedJobDTO } from '@/features/applications/types';

interface SavedJobsProps {
  savedJobs: SavedJobDTO[];
  onRemove: (jobId: string) => void;
  onApplyNow?: (job: SavedJobDTO) => void;
}

export const SavedJobs: React.FC<SavedJobsProps> = ({ savedJobs, onRemove, onApplyNow }) => {
  const [openCollectionModal, setOpenCollectionModal] = useState(false);
  const [collectionName, setCollectionName] = useState('');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Saved Opportunities & Collections
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setOpenCollectionModal(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Create Collection
        </Button>
      </Box>

      <Grid container spacing={3}>
        {savedJobs.map((job) => (
          <Grid item xs={12} md={6} key={job.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: 'rgba(0, 102, 255, 0.4)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar src={job.company_logo} variant="rounded" sx={{ width: 48, height: 48 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                      {job.job_title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {job.company_name} &bull; {job.location}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => onRemove(job.job_id)} sx={{ color: 'text.secondary' }}>
                  <BookmarkRemoveIcon fontSize="small" />
                </IconButton>
              </Box>

              {job.collection_name && (
                <Chip
                  icon={<FolderSpecialIcon fontSize="small" />}
                  label={job.collection_name}
                  size="small"
                  sx={{ mb: 2, bgcolor: 'rgba(0, 102, 255, 0.12)', color: 'primary.main', fontWeight: 600 }}
                />
              )}

              {job.notes && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 2 }}>
                  &ldquo;{job.notes}&rdquo;
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Saved on {new Date(job.saved_at).toLocaleDateString()}
                </Typography>
                {onApplyNow && (
                  <Button
                    size="small"
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={() => onApplyNow(job)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Quick Apply
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}

        {savedJobs.length === 0 && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, background: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                No saved jobs yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Bookmark interesting job postings to organize them into collections and apply when ready.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={openCollectionModal} onClose={() => setOpenCollectionModal(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Job Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Collection Name (e.g., Remote Roles, High Salary)"
            fullWidth
            variant="outlined"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCollectionModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenCollectionModal(false)}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
