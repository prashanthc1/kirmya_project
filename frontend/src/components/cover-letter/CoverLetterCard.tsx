'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  ContentCopy as DuplicateIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  AutoAwesome as AIIcon,
  WorkOutline as JobIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { CoverLetter } from '@/features/cover-letter/types';

interface CoverLetterCardProps {
  letter: CoverLetter;
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CoverLetterCard: React.FC<CoverLetterCardProps> = ({
  letter,
  onEdit,
  onPreview,
  onDuplicate,
  onDownload,
  onShare,
  onDelete,
}) => {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 3,
          p: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(99, 102, 241, 0.4)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
          },
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {letter.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {letter.jobTitle} {letter.companyName ? `• ${letter.companyName}` : ''}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              {letter.isAiGenerated && (
                <Tooltip title="AI Generated">
                  <Chip
                    icon={<AIIcon sx={{ fontSize: '14px !important', color: '#818cf8' }} />}
                    label="AI"
                    size="small"
                    sx={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 600 }}
                  />
                </Tooltip>
              )}
              {letter.isJobSpecific && (
                <Tooltip title="Job Tailored">
                  <Chip
                    icon={<JobIcon sx={{ fontSize: '14px !important', color: '#34d399' }} />}
                    label="Tailored"
                    size="small"
                    sx={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontWeight: 600 }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2,
              fontStyle: 'italic',
              background: 'rgba(0,0,0,0.2)',
              p: 1.5,
              borderRadius: 2,
            }}
          >
            "{letter.introduction || letter.body}"
          </Typography>

          <Stack direction="row" spacing={2} mb={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Template
              </Typography>
              <Typography variant="body2" fontWeight={600} textTransform="capitalize">
                {letter.templateName}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Length
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {letter.wordCount} words
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Match Score
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#34d399">
                {letter.jobMatchScore}%
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" pt={1} borderTop="1px solid rgba(255,255,255,0.06)">
            <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => onEdit(letter.id)} sx={{ borderRadius: 2 }}>
              Edit
            </Button>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => onPreview(letter.id)} title="Preview">
                <PreviewIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDuplicate(letter.id)} title="Duplicate">
                <DuplicateIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDownload(letter.id)} title="Download PDF">
                <DownloadIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onShare(letter.id)} title="Share">
                <ShareIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => onDelete(letter.id)} title="Delete">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};
