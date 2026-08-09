'use client';

import React from 'react';
import { Box, Stack, IconButton, Divider, Tooltip, Typography } from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletIcon,
  FormatListNumbered as NumberedIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';

export interface CoverLetterToolbarProps {
  onFormat: (command: string) => void;
  wordCount: number;
  charCount: number;
  isAutoSaved?: boolean;
}

export const CoverLetterToolbar: React.FC<CoverLetterToolbarProps> = ({
  onFormat,
  wordCount,
  charCount,
  isAutoSaved = true,
}) => {
  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="Bold">
          <IconButton size="small" onClick={() => onFormat('bold')}>
            <BoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton size="small" onClick={() => onFormat('italic')}>
            <ItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton size="small" onClick={() => onFormat('underline')}>
            <UnderlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Bullet List">
          <IconButton size="small" onClick={() => onFormat('insertUnorderedList')}>
            <BulletIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton size="small" onClick={() => onFormat('insertOrderedList')}>
            <NumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Align Left">
          <IconButton size="small" onClick={() => onFormat('justifyLeft')}>
            <AlignLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Center">
          <IconButton size="small" onClick={() => onFormat('justifyCenter')}>
            <AlignCenterIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Right">
          <IconButton size="small" onClick={() => onFormat('justifyRight')}>
            <AlignRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Undo">
          <IconButton size="small" onClick={() => onFormat('undo')}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton size="small" onClick={() => onFormat('redo')}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {wordCount} words | {charCount} chars
        </Typography>
        {isAutoSaved && (
          <Typography variant="caption" color="#34d399" fontWeight={600}>
            ✓ Auto-saved
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
