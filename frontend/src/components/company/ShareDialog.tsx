'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Stack,
  TextField,
  Button,
  IconButton,
  Box,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
  handle: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  companyName,
  handle,
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/company/${handle}` : `https://kirmya.com/company/${handle}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
        Share {companyName} Profile
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {copied && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
            Link copied to clipboard!
          </Alert>
        )}

        <Box sx={{ textCenter: 'center', textAlign: 'center', my: 2 }}>
          <Box
            sx={{
              width: 140,
              height: 140,
              mx: 'auto',
              borderRadius: '16px',
              border: '2px dashed #6366f1',
              bgcolor: 'rgba(99, 102, 241, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <QrCode2Icon sx={{ fontSize: 72, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              Scan QR Code
            </Typography>
          </Box>
        </Box>

        <TextField
          value={shareUrl}
          fullWidth
          size="small"
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Button size="small" onClick={handleCopy} startIcon={<ContentCopyIcon />} sx={{ textTransform: 'none', fontWeight: 800 }}>
                Copy
              </Button>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1, textAlign: 'center' }}>
          Or Share Directly To Social Platforms:
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <IconButton component="a" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" sx={{ color: '#0077b5', bgcolor: 'rgba(0,119,181,0.1)' }}>
            <LinkedInIcon />
          </IconButton>

          <IconButton component="a" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" sx={{ color: '#1877f2', bgcolor: 'rgba(24,119,242,0.1)' }}>
            <FacebookIcon />
          </IconButton>

          <IconButton component="a" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`} target="_blank" sx={{ color: '#1da1f2', bgcolor: 'rgba(29,161,242,0.1)' }}>
            <TwitterIcon />
          </IconButton>

          <IconButton component="a" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`} target="_blank" sx={{ color: '#25d366', bgcolor: 'rgba(37,211,102,0.1)' }}>
            <WhatsAppIcon />
          </IconButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
