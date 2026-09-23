'use client';

import React from 'react';
import { Paper, Typography, Box, Stack, Checkbox, IconButton, Button } from '@mui/material';
import { surfaceTransition } from '../../theme/motion';
import { Delete, Add, Event } from '@mui/icons-material';
import { PreparationTask } from '@/features/interview-prep/types';

interface PrepTaskListProps {
  tasks: PreparationTask[];
  onToggle: (id: string, isCompleted: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onOpenAddTask?: () => void;
}

export const PrepTaskList: React.FC<PrepTaskListProps> = ({ tasks, onToggle, onDelete, onOpenAddTask }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: "background.paper",
        backdropFilter: 'blur(12px)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        color: "text.primary",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Preparation Checklist & Tasks
        </Typography>
        {onOpenAddTask && (
          <Button
            size="small"
            startIcon={<Add />}
            onClick={onOpenAddTask}
            sx={{ color: "primary.main", textTransform: 'none', fontWeight: 600 }}
          >
            Add Task
          </Button>
        )}
      </Stack>

      <Stack spacing={1}>
        {tasks.map((task) => (
          <Stack
            key={task.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: "background.paper",
              border: (theme) => `1px solid ${theme.palette.divider}`,
              transition: surfaceTransition(0.2),
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
              <Checkbox
                checked={task.is_completed}
                onChange={(e) => onToggle(task.id, e.target.checked)}
                sx={{ color: "text.secondary", '&.Mui-checked': { color: '#10B981' } }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: task.is_completed ? "text.secondary" : "text.primary",
                  textDecoration: task.is_completed ? 'line-through' : 'none',
                  fontWeight: 500,
                }}
              >
                {task.title}
              </Typography>
            </Stack>

            {onDelete && (
              <IconButton size="small" onClick={() => onDelete(task.id)} sx={{ color: "text.secondary", '&:hover': { color: '#EF4444' } }}>
                <Delete sx={{ fontSize: '1rem' }} />
              </IconButton>
            )}
          </Stack>
        ))}

        {tasks.length === 0 && (
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: 'center', py: 2 }}>
            No preparation tasks added yet.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};
