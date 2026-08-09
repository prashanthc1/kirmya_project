'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EventIcon from '@mui/icons-material/Event';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GlassCard from '../landing/GlassCard';
import { CandidatePipelineItem } from '../../features/recruiter/types';
import { recruiterApi } from '../../features/recruiter/api';

interface CandidatePipelineProps {
  pipeline: CandidatePipelineItem[];
  onStageChange?: () => void;
}

const STAGES = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview',
  'Technical Round',
  'Final Interview',
  'Offer',
  'Hired',
  'Rejected',
];

export const CandidatePipeline: React.FC<CandidatePipelineProps> = ({ pipeline, onStageChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<CandidatePipelineItem | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: CandidatePipelineItem) => {
    setAnchorEl(e.currentTarget);
    setSelectedItem(item);
  };

  const handleMoveStage = async (nextStage: string) => {
    if (!selectedItem) return;
    try {
      await recruiterApi.updatePipelineStage(selectedItem.id, nextStage);
      onStageChange?.();
    } catch {
      onStageChange?.();
    } finally {
      setAnchorEl(null);
    }
  };

  return (
    <GlassCard sx={{ p: { xs: 2, md: 3 }, overflowX: 'auto', mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
        ATS Candidate Recruitment Pipeline
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, minWidth: 1200, pb: 2 }}>
        {STAGES.slice(0, 7).map((stage) => {
          const items = pipeline.filter((i) => i.stage.toLowerCase() === stage.toLowerCase());
          return (
            <Paper
              key={stage}
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 240,
                p: 2,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  {stage}
                </Typography>
                <Chip label={items.length} size="small" color="primary" sx={{ fontWeight: 800, height: 20 }} />
              </Stack>

              <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                {items.map((item) => (
                  <Paper
                    key={item.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {item.candidateName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {item.candidateEmail}
                        </Typography>
                      </Box>

                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, item)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    {item.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}>
                        &quot;{item.notes}&quot;
                      </Typography>
                    )}

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ArrowForwardIcon fontSize="small" />}
                      onClick={(e) => handleMenuOpen(e, item)}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', mt: 1 }}
                    >
                      Move Stage
                    </Button>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      {/* Stage Change Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <Typography variant="caption" sx={{ px: 2, py: 0.5, fontWeight: 800, color: 'text.secondary', display: 'block' }}>
          Move Candidate to Stage:
        </Typography>
        {STAGES.map((s) => (
          <MenuItem key={s} onClick={() => handleMoveStage(s)} sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
            {s}
          </MenuItem>
        ))}
      </Menu>
    </GlassCard>
  );
};

export default CandidatePipeline;
