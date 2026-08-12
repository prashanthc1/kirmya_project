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
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#fff',
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
            sx={{ color: '#60A5FA', textTransform: 'none', fontWeight: 600 }}
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
              bgcolor: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: surfaceTransition(0.2),
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
              <Checkbox
                checked={task.is_completed}
                onChange={(e) => onToggle(task.id, e.target.checked)}
                sx={{ color: '#64748B', '&.Mui-checked': { color: '#10B981' } }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: task.is_completed ? '#64748B' : '#F8FAFC',
                  textDecoration: task.is_completed ? 'line-through' : 'none',
                  fontWeight: 500,
                }}
              >
                {task.title}
              </Typography>
            </Stack>

            {onDelete && (
              <IconButton size="small" onClick={() => onDelete(task.id)} sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}>
                <Delete sx={{ fontSize: '1rem' }} />
              </IconButton>
            )}
          </Stack>
        ))}

        {tasks.length === 0 && (
          <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', py: 2 }}>
            No preparation tasks added yet.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};
