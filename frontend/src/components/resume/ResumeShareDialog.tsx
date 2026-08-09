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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ResumeShare } from '@/features/resume/types';

interface ResumeShareDialogProps {
  open: boolean;
  onClose: () => void;
  shareInfo?: ResumeShare | null;
  onGenerateShare: (privacyLevel: string) => void;
}

export const ResumeShareDialog: React.FC<ResumeShareDialogProps> = ({
  open,
  onClose,
  shareInfo,
  onGenerateShare,
}) => {
  const [privacy, setPrivacy] = useState('Public');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (shareInfo?.shareUrl) {
      navigator.clipboard.writeText(shareInfo.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShareIcon sx={{ color: 'primary.main' }} /> Share Resume & Privacy Controls
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Generate a public link or QR code for your resume with customizable privacy visibility controls.
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Privacy Level</InputLabel>
          <Select value={privacy} label="Privacy Level" onChange={(e) => setPrivacy(e.target.value)}>
            <MenuItem value="Public">Public (Anyone with link)</MenuItem>
            <MenuItem value="Recruiters Only">Recruiters Only</MenuItem>
            <MenuItem value="Connections Only">Connections Only</MenuItem>
            <MenuItem value="Private">Private</MenuItem>
          </Select>
        </FormControl>

        {!shareInfo ? (
          <Button variant="contained" fullWidth onClick={() => onGenerateShare(privacy)} sx={{ borderRadius: 2, fontWeight: 800, py: 1 }}>
            Generate Share Link & QR Code
          </Button>
        ) : (
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>
                Public URL
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" value={shareInfo.shareUrl} InputProps={{ readOnly: true }} />
                <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopy} sx={{ minWidth: 100, textTransform: 'none', fontWeight: 700 }}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                QR Code for Scannable Resumes
              </Typography>
              <Box component="img" src={shareInfo.qrCodeUrl} alt="QR Code" sx={{ width: 140, height: 140, borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)', mx: 'auto' }} />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
};
