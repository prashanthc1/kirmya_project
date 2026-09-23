'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StarIcon from '@mui/icons-material/Star';
import { CandidateDocument } from '@/features/applications/types';
import { applicationsApi } from '@/features/applications/api';

interface DocumentManagerProps {
  documents: CandidateDocument[];
  /** Called after a successful multipart upload so the parent can refresh lists. */
  onUploaded?: (doc: CandidateDocument) => void;
  onDelete: (id: string) => void;
  /**
   * @deprecated Prefer letting DocumentManager call applicationsApi.uploadDocument.
   * Kept only so older parents that still pass a JSON-style handler continue to typecheck
   * until they migrate.
   */
  onUpload?: (payload: {
    title: string;
    document_type: string;
    file_url: string;
    is_default: boolean;
  }) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onUploaded,
  onDelete,
  onUpload,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('Resume');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDocType('Resume');
    setFile(null);
    setError(null);
    setUploading(false);
  };

  const handleClose = () => {
    if (uploading) return;
    setOpenModal(false);
    resetForm();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!file) {
      setError('Please choose a PDF file to upload.');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF documents are accepted.');
      return;
    }

    setUploading(true);
    try {
      const doc = await applicationsApi.uploadDocument({
        file,
        title: title.trim() || file.name,
        document_type: docType,
        is_default: docType === 'Resume',
      });
      onUploaded?.(doc);
      // Legacy callback: no real URL is available until download; pass the API path.
      onUpload?.({
        title: doc.title,
        document_type: doc.document_type,
        file_url: doc.file_url,
        is_default: doc.is_default,
      });
      setOpenModal(false);
      resetForm();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Upload failed. Please try again.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Documents & Resumes
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Upload Document
        </Button>
      </Box>

      {documents.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have not uploaded any documents yet. Add a PDF resume to use it when applying.
        </Alert>
      )}

      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} key={doc.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "action.hover",
                backdropFilter: 'blur(16px)',
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <DescriptionIcon sx={{ color: 'primary.main', fontSize: 36 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      {doc.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => onDelete(doc.id)} sx={{ color: 'error.main' }} aria-label={`Delete ${doc.title}`}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label={doc.document_type} size="small" variant="outlined" />
                {doc.is_default && (
                  <Chip
                    icon={<StarIcon fontSize="small" />}
                    label="Default Resume"
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Button size="small" variant="text" component="a" href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  View File
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Candidate Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <TextField
              label="Document Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Staff Engineer Resume 2026"
              disabled={uploading}
            />
            <TextField
              select
              label="Document Type"
              fullWidth
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={uploading}
            >
              <MenuItem value="Resume">Resume</MenuItem>
              <MenuItem value="Cover Letter">Cover Letter</MenuItem>
              <MenuItem value="Certificate">Certificate</MenuItem>
              <MenuItem value="Portfolio">Portfolio</MenuItem>
            </TextField>
            <Button variant="outlined" component="label" disabled={uploading} sx={{ justifyContent: 'flex-start' }}>
              {file ? file.name : 'Choose PDF file'}
              <input
                type="file"
                hidden
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Typography variant="caption" color="text.secondary">
              PDF only, max 10 MB. The file is uploaded to Kirmya — do not paste an external URL.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={uploading || !file}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManager;
