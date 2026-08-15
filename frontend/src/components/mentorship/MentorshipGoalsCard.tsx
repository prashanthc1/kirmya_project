import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Checkbox,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { MentorshipGoal } from '../../features/mentorship/types';

interface MentorshipGoalsCardProps {
  goals: MentorshipGoal[];
  onAddGoal?: (goal: Partial<MentorshipGoal>) => Promise<void>;
  onUpdateGoal?: (goalId: string, updates: Partial<MentorshipGoal>) => Promise<void>;
  onDeleteGoal?: (goalId: string) => Promise<void>;
}

export const MentorshipGoalsCard: React.FC<MentorshipGoalsCardProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [editingGoal, setEditingGoal] = useState<MentorshipGoal | null>(null);

  const completedCount = goals.filter((g) => g.status === 'completed').length;
  const overallProgress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setNewTitle('');
    setNewDesc('');
    setTargetDate(new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]);
    setOpenModal(true);
  };

  const handleOpenEdit = (goal: MentorshipGoal) => {
    setEditingGoal(goal);
    setNewTitle(goal.title);
    setNewDesc(goal.description);
    setTargetDate(goal.target_date ? goal.target_date.split('T')[0] : '');
    setOpenModal(true);
  };

  const handleSaveGoal = async () => {
    if (!newTitle.trim()) return;

    if (editingGoal) {
      await onUpdateGoal?.(editingGoal.id, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        target_date: targetDate || new Date().toISOString(),
      });
    } else {
      await onAddGoal?.({
        title: newTitle.trim(),
        description: newDesc.trim(),
        status: 'pending',
        target_date: targetDate || new Date(Date.now() + 86400000 * 14).toISOString(),
        progress: 0,
      });
    }
    setOpenModal(false);
  };

  const handleToggleStatus = async (goal: MentorshipGoal) => {
    const nextStatus = goal.status === 'completed' ? 'in_progress' : 'completed';
    const nextProgress = nextStatus === 'completed' ? 100 : 50;
    await onUpdateGoal?.(goal.id, {
      status: nextStatus,
      progress: nextProgress,
    });
  };

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(255, 255, 255, 0.6)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        boxShadow: (theme) =>
          theme.palette.mode === 'light'
            ? '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header & Add Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TrackChangesIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Mentorship Goals
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completedCount} of {goals.length} goals achieved
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              borderRadius: '10px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            }}
          >
            Add Goal
          </Button>
        </Box>

        {/* Overall Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              OVERALL MILESTONE PROGRESS
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary.main">
              {overallProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: (theme) =>
                theme.palette.mode === 'light'
                  ? 'rgba(99, 102, 241, 0.12)'
                  : 'rgba(129, 140, 248, 0.15)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
              },
            }}
          />
        </Box>

        {/* Goals List */}
        <Stack spacing={2}>
          {goals.length === 0 ? (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px dashed rgba(140,140,140,0.3)',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No active goals created yet. Click "Add Goal" to get started!
              </Typography>
            </Box>
          ) : (
            goals.map((goal) => {
              const isDone = goal.status === 'completed';
              return (
                <Box
                  key={goal.id}
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    bgcolor: (theme) =>
                      isDone
                        ? theme.palette.mode === 'light'
                          ? 'rgba(34, 197, 94, 0.06)'
                          : 'rgba(34, 197, 94, 0.1)'
                        : theme.palette.mode === 'light'
                        ? 'rgba(255, 255, 255, 0.6)'
                        : 'rgba(15, 23, 42, 0.4)',
                    border: (theme) =>
                      isDone
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : theme.palette.mode === 'light'
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                  }}
                >
                  <Tooltip title={isDone ? 'Mark in progress' : 'Mark as completed'}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleStatus(goal)}
                      color={isDone ? 'success' : 'default'}
                      sx={{ mt: 0.25 }}
                    >
                      {isDone ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                    </IconButton>
                  </Tooltip>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? 'text.secondary' : 'text.primary',
                        }}
                      >
                        {goal.title}
                      </Typography>
                      <Chip
                        label={goal.status.replace('_', ' ')}
                        size="small"
                        color={isDone ? 'success' : goal.status === 'in_progress' ? 'primary' : 'default'}
                        variant={isDone ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.68rem', textTransform: 'capitalize', fontWeight: 600 }}
                      />
                    </Box>
                    {goal.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {goal.description}
                      </Typography>
                    )}
                    {goal.target_date && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                        Target Date: {new Date(goal.target_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleOpenEdit(goal)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDeleteGoal?.(goal.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          )}
        </Stack>
      </CardContent>

      {/* Add / Edit Goal Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '18px', p: 1 },
        }}
      >
        <DialogTitle fontWeight={700}>
          {editingGoal ? 'Edit Mentorship Goal' : 'Create New Mentorship Goal'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Goal Title"
              fullWidth
              size="small"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Master System Design Principles"
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Key action items and deliverables..."
            />
            <TextField
              label="Target Completion Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSaveGoal} variant="contained" disabled={!newTitle.trim()}>
            {editingGoal ? 'Save Changes' : 'Create Goal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default MentorshipGoalsCard;
