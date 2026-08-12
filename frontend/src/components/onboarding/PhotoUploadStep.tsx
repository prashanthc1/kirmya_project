'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Avatar,
  Slider,
  IconButton,
  Alert,
  useTheme,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';

interface StepProps {
  onNext: () => void;
  onPrev: () => void;
}

export const PhotoUploadStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [preview, setPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds maximum allowed limit of 5 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Upload Profile Picture
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Profiles with professional photos receive 4.8x more views and recruiter connection requests.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Stack spacing={4} alignItems="center">
          {/* Avatar Preview */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={preview || undefined}
              sx={{
                width: 140,
                height: 140,
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.25)',
                border: '4px solid',
                borderColor: 'primary.main',
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                transition: 'transform 0.2s ease',
              }}
            />
          </Box>

          {/* Controls */}
          {preview ? (
            <Stack direction="row" spacing={3} alignItems="center">
              <IconButton onClick={handleRotate} color="primary" title="Rotate">
                <RotateRightIcon />
              </IconButton>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 180 }}>
                <ZoomInIcon fontSize="small" color="action" />
                <Slider
                  value={zoom}
                  min={0.8}
                  max={1.8}
                  step={0.1}
                  onChange={(_, val) => setZoom(val as number)}
                  size="small"
                />
              </Stack>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
              }}
            >
              Choose Image (JPG, PNG, WEBP &lt; 5MB)
              <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            </Button>
          )}

          {/* Navigation */}
          <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ width: '100%', pt: 2 }}>
            <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
              Back
            </Button>
            <Stack direction="row" spacing={2}>
              <Button variant="text" onClick={onNext} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Skip For Now
              </Button>
              <Button
                variant="contained"
                onClick={onNext}
                endIcon={<ArrowForwardIcon />}
                sx={{ py: 1.2, px: 3.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
              >
                Continue
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </GlassCard>
    </motion.div>
  );
};

export default PhotoUploadStep;
