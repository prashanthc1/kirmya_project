'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  MenuItem,
  Stack,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ContentCopy as CopyIcon, Share as ShareIcon } from '@mui/icons-material';
import { CoverLetterShare } from '@/features/cover-letter/types';

export interface CoverLetterShareDialogProps {
  open: boolean;
  onClose: () => void;
  onShare: (privacyLevel: string) => Promise<CoverLetterShare>;
  onRevoke: () => Promise<void>;
  existingShare?: CoverLetterShare | null;
}

export const CoverLetterShareDialog: React.FC<CoverLetterShareDialogProps> = ({
  open,
  onClose,
  onShare,
  onRevoke,
  existingShare,
}) => {
  const [privacyLevel, setPrivacyLevel] = useState<'Public' | 'Recruiters Only' | 'Connections Only' | 'Private'>(
    (existingShare?.privacyLevel as any) || 'Public'
  );
  const [shareData, setShareData] = useState<CoverLetterShare | null>(existingShare || null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await onShare(privacyLevel);
      setShareData(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareData?.shareUrl) {
      navigator.clipboard.writeText(shareData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle display="flex" alignItems="center" gap={1}>
        <ShareIcon color="primary" />
        Cover Letter Sharing & Access Settings
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Configure privacy settings and generate a secure public or recruiter share URL.
        </Typography>

        <TextField
          select
          fullWidth
          label="Privacy Control"
          value={privacyLevel}
          onChange={(e) => setPrivacyLevel(e.target.value as any)}
          sx={{ mb: 3 }}
        >
          <MenuItem value="Public">Public (Anyone with link)</MenuItem>
          <MenuItem value="Recruiters Only">Recruiters Only (Verified Kirmya recruiters)</MenuItem>
          <MenuItem value="Connections Only">Connections Only (Your 1st-degree network)</MenuItem>
          <MenuItem value="Private">Private (Only you)</MenuItem>
        </TextField>

        {shareData && (
          <Box sx={{ background: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Share URL
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField fullWidth size="small" value={shareData.shareUrl} InputProps={{ readOnly: true }} />
              <Tooltip title={copied ? 'Copied!' : 'Copy Link'}>
                <IconButton color="primary" onClick={handleCopy}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            {copied && (
              <Alert severity="success" sx={{ mt: 1, py: 0, borderRadius: 2 }}>
                Link copied to clipboard!
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {shareData && (
          <Button color="error" onClick={onRevoke}>
            Revoke Access
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleGenerate} disabled={loading}>
          {shareData ? 'Update Share Link' : 'Generate Link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
