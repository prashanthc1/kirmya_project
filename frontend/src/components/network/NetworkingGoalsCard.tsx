'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Box,
  Stack,
  Button,
  LinearProgress,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
} from '@mui/material';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlusOneIcon from '@mui/icons-material/PlusOne';
import { NetworkingGoal, networkingApi } from '../../features/networking/services/networkingApi';

export const NetworkingGoalsCard: React.FC = () => {
  const [goals, setGoals] = useState<NetworkingGoal[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState(10);
  const [newCategory, setNewCategory] = useState<'connect' | 'outreach' | 'referral' | 'event'>('connect');

  const loadGoals = () => {
    networkingApi.getNetworkingGoals().then((data) => setGoals(data));
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async () => {
    if (!newTitle.trim()) return;
    try {
      await networkingApi.createNetworkingGoal({
        title: newTitle,
        targetCount: Number(newTarget) || 1,
        currentCount: 0,
        category: newCategory,
      });
      setOpenDialog(false);
      setNewTitle('');
      setNewTarget(10);
      loadGoals();
    } catch {
      alert('Failed to create goal.');
    }
  };

  const handleIncrement = async (goal: NetworkingGoal) => {
    try {
      await networkingApi.updateGoalProgress(goal.id, goal.currentCount + 1);
      loadGoals();
    } catch {
      alert('Failed to update progress.');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await networkingApi.deleteNetworkingGoal(id);
      loadGoals();
    } catch {
      alert('Failed to delete goal.');
    }
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '24px',
        mb: 3,
        backdropFilter: 'blur(16px)',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TrackChangesIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Networking Goals & Growth Targets
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Track outreach, connections, and relationship milestone objectives.
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          Add Goal
        </Button>
      </Stack>

      <Stack spacing={2}>
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
          return (
            <Box
              key={goal.id}
              sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: goal.completed ? 'success.light' : 'divider',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {goal.completed ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <Chip label={goal.category || 'connect'} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  )}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, textDecoration: goal.completed ? 'line-through' : 'none' }}>
                    {goal.title}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  {!goal.completed && (
                    <Tooltip title="Log progress (+1)">
                      <IconButton size="small" color="primary" onClick={() => handleIncrement(goal)}>
                        <PlusOneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete goal">
                    <IconButton size="small" color="error" onClick={() => handleDeleteGoal(goal.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    color={goal.completed ? 'success' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 900, minWidth: 60, textAlign: 'right' }}>
                  {goal.currentCount} / {goal.targetCount} ({pct}%)
                </Typography>
              </Stack>
            </Box>
          );
        })}

        {goals.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontStyle: 'italic' }}>
            No active networking goals set. Create one to keep your growth on track!
          </Typography>
        )}
      </Stack>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Create Networking Goal</DialogTitle>
        <DialogContent>
          <Stack spacing= {2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Goal Title"
              placeholder="Ex: Connect with 15 Tech Leads in Dubai"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Target Count"
              value={newTarget}
              onChange={(e) => setNewTarget(Number(e.target.value))}
            />
            <TextField
              select
              fullWidth
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
            >
              <MenuItem value="connect">Direct Connections</MenuItem>
              <MenuItem value="outreach">Outreach Messages</MenuItem>
              <MenuItem value="referral">Internal Referrals</MenuItem>
              <MenuItem value="event">Events & Networking</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ borderRadius: '12px', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button onClick={handleCreateGoal} variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Create Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default NetworkingGoalsCard;
