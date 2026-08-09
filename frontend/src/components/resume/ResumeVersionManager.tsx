'use client';

import React from 'react';
import { Paper, Box, Typography, Stack, Button, Chip } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import { ResumeVersion } from '@/features/resume/types';

interface ResumeVersionManagerProps {
  versions: ResumeVersion[];
  onRestore: (version: ResumeVersion) => void;
}

export const ResumeVersionManager: React.FC<ResumeVersionManagerProps> = ({ versions, onRestore }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <HistoryIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Version Snapshots & History
        </Typography>
      </Box>

      {versions.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No previous version checkpoints saved yet. Automatic checkpoints are created whenever you update your resume.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {versions.map((ver) => (
            <Box
              key={ver.id}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {ver.versionTag}
                  </Typography>
                  <Chip label={`ATS ${ver.atsScore}%`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Saved on {new Date(ver.createdAt).toLocaleString()}
                </Typography>
              </Box>

              <Button size="small" variant="outlined" startIcon={<RestoreIcon />} onClick={() => onRestore(ver)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                Restore
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
};
