'use client';

import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ShareIcon from '@mui/icons-material/Share';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { Resume } from '@/features/resume/types';

interface ResumeCardProps {
  resume: Resume;
  onEdit: (resume: Resume) => void;
  onPreview: (resume: Resume) => void;
  onDuplicate: (resume: Resume) => void;
  onDownload: (resume: Resume) => void;
  onSetDefault: (resume: Resume) => void;
  onShare: (resume: Resume) => void;
  onDelete: (resume: Resume) => void;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  onEdit,
  onPreview,
  onDuplicate,
  onDownload,
  onSetDefault,
  onShare,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        border: resume.isDefault ? '1.5px solid #0066FF' : '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        },
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ pr: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {resume.title}
            </Typography>
            {resume.isDefault && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#0066FF' }} />}
                label="Default Resume"
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 102, 255, 0.12)',
                  color: '#0066FF',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  border: '1px solid rgba(0, 102, 255, 0.3)',
                }}
              />
            )}
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            Template: {resume.templateName.toUpperCase()} • Updated{' '}
            {new Date(resume.updatedAt).toLocaleDateString()}
          </Typography>
        </Box>

        <IconButton onClick={handleOpenMenu} size="small" sx={{ color: 'text.secondary' }}>
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            ATS Score
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#00CC66' }}>
            {resume.atsScore}%
          </Typography>
        </Box>

        <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Completion
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0066FF' }}>
            {resume.completionPercentage}%
          </Typography>
        </Box>

        <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Applications
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#9933FF' }}>
            {resume.applicationCount || 3}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => onEdit(resume)}
          sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => onPreview(resume)}
          sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Preview
        </Button>
      </Stack>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onDuplicate(resume);
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onDownload(resume);
          }}
        >
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onSetDefault(resume);
          }}
        >
          <ListItemIcon>
            {resume.isDefault ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{resume.isDefault ? 'Is Default' : 'Set As Default'}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onShare(resume);
          }}
        >
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share Link</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onDelete(resume);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};
