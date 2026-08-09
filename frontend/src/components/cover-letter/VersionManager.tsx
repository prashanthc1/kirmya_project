'use client';

import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Button, Paper } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { CoverLetterVersion } from '@/features/cover-letter/types';

export interface VersionManagerProps {
  versions: CoverLetterVersion[];
  onRestore: (version: CoverLetterVersion) => void;
}

export const VersionManager: React.FC<VersionManagerProps> = ({ versions, onRestore }) => {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)' }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <HistoryIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Version History & Backups
        </Typography>
      </Box>

      {versions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No previous version snapshots found. Auto-saves will create history checkpoints.
        </Typography>
      ) : (
        <List disablePadding>
          {versions.map((v) => (
            <ListItem
              key={v.id}
              sx={{
                mb: 1,
                p: 1.5,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {v.versionTag}
                    </Typography>
                    <Chip label={`${v.wordCount} words`} size="small" variant="outlined" />
                  </Box>
                }
                secondary={`Saved by ${v.createdBy} on ${new Date(v.createdAt).toLocaleString()}`}
              />
              <Button variant="outlined" size="small" onClick={() => onRestore(v)} sx={{ borderRadius: 2 }}>
                Restore
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};
