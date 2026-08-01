'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  IconButton,
  Chip,
  Box,
  FormControlLabel,
  Checkbox,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import { TalentPoolDTO, CandidateSearchResultItem } from '../../../features/recruiter/search/types';
import { candidateSearchApi } from '../../../features/recruiter/search/api';

interface TalentPoolManagerProps {
  open: boolean;
  onClose: () => void;
  talentPools: TalentPoolDTO[];
  selectedCandidate?: CandidateSearchResultItem | null;
  onRefresh: () => void;
}

export const TalentPoolManager: React.FC<TalentPoolManagerProps> = ({
  open,
  onClose,
  talentPools,
  selectedCandidate,
  onRefresh,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shared, setShared] = useState(true);

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await candidateSearchApi.createTalentPool({ name, description, shared_with_team: shared });
      setName('');
      setDescription('');
      onRefresh();
    } catch {
      onRefresh();
    }
  };

  const handleAddCandidate = async (poolId: string) => {
    if (!selectedCandidate) return;
    try {
      await candidateSearchApi.addCandidateToPool(poolId, selectedCandidate.id);
      onClose();
      onRefresh();
    } catch {
      onClose();
      onRefresh();
    }
  };

  const handleDeletePool = async (id: string) => {
    try {
      await candidateSearchApi.deleteTalentPool(id);
      onRefresh();
    } catch {
      onRefresh();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>
        {selectedCandidate ? `Add ${selectedCandidate.name} to Talent Pool` : 'Manage Talent Pools'}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Create New Talent Pool Form */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
            Create New Talent Pool
          </Typography>

          <form onSubmit={handleCreatePool}>
            <Stack spacing={2}>
              <TextField label="Talent Pool Name *" size="small" fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Backend Go Engineers" />
              <TextField label="Description" size="small" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Target pool description..." />
              <FormControlLabel
                control={<Checkbox checked={shared} onChange={(e) => setShared(e.target.checked)} color="primary" />}
                label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Share Pool with Hiring Team</Typography>}
              />
              <Button type="submit" variant="contained" startIcon={<FolderSpecialIcon />} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', py: 1 }}>
                Create Talent Pool
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Existing Pools List */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
          Existing Talent Pools ({talentPools.length})
        </Typography>

        <Stack spacing={1.5}>
          {talentPools.map((pool) => (
            <Paper
              key={pool.id}
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
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {pool.name}
                  </Typography>
                  {pool.shared_with_team && <ShareIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {pool.description || 'No description'}
                </Typography>
                <Chip label={`${pool.candidates_count} Candidates`} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
              </Box>

              <Stack direction="row" spacing={1}>
                {selectedCandidate ? (
                  <Button variant="contained" size="small" onClick={() => handleAddCandidate(pool.id)} sx={{ borderRadius: '8px', fontWeight: 800 }}>
                    Add Here
                  </Button>
                ) : (
                  <IconButton color="error" onClick={() => handleDeletePool(pool.id)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default TalentPoolManager;
