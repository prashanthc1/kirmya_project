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
  Divider,
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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Link from 'next/link';

import { Resume } from '../../features/resume/types';
import { tokens } from '../../theme/tokens';

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

  const updatedDate = resume.updatedAt
    ? new Date(resume.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <Paper
      elevation={0}
      data-testid={`resume-card-${resume.id}`}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: `${tokens.radius.lg}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: resume.isDefault ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.3)'
              : '0 8px 24px rgba(99, 102, 241, 0.08)',
        },
      }}
    >
      {/* Top Row: Title, Default Chip, Actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box sx={{ pr: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                letterSpacing: '-0.01em',
              }}
            >
              {resume.title}
            </Typography>

            {resume.isDefault && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                label="Primary Default"
                size="small"
                color="primary"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  borderRadius: `${tokens.radius.pill}px`,
                  height: 22,
                }}
              />
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
            Template: <strong style={{ textTransform: 'capitalize' }}>{resume.templateName || 'Classic'}</strong> • Updated {updatedDate}
          </Typography>
        </Box>

        <IconButton size="small" onClick={handleOpenMenu} aria-label="More actions">
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* ATS & Completeness Badges */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        {resume.atsScore !== undefined && (
          <Chip
            label={`ATS Score: ${resume.atsScore}%`}
            size="small"
            color={resume.atsScore >= 80 ? 'success' : resume.atsScore >= 60 ? 'warning' : 'default'}
            sx={{ fontWeight: 700, fontSize: '0.75rem', borderRadius: `${tokens.radius.sm}px` }}
          />
        )}

        {resume.completionPercentage !== undefined && (
          <Chip
            label={`${resume.completionPercentage}% Complete`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.75rem', borderRadius: `${tokens.radius.sm}px` }}
          />
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Action Buttons */}
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<EditIcon fontSize="small" />}
            onClick={() => onEdit(resume)}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.8rem',
            }}
          >
            Edit Resume
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon fontSize="small" />}
            onClick={() => onPreview(resume)}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.8rem',
            }}
          >
            Preview
          </Button>
        </Stack>

        <Button
          variant="text"
          size="small"
          startIcon={<DownloadIcon fontSize="small" />}
          onClick={() => onDownload(resume)}
          sx={{
            borderRadius: `${tokens.radius.sm}px`,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.8rem',
          }}
        >
          Download
        </Button>
      </Stack>

      {/* Dropdown Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        {!resume.isDefault && (
          <MenuItem
            onClick={() => {
              handleCloseMenu();
              onSetDefault(resume);
            }}
          >
            <ListItemIcon>
              <StarIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Set as Primary Default" />
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onDuplicate(resume);
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Duplicate Version" />
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
          <ListItemText primary="Share Public Link" />
        </MenuItem>

        <Divider />

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
          <ListItemText primary="Delete Resume" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ResumeCard;
