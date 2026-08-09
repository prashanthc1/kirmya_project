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
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StarIcon from '@mui/icons-material/Star';
import { CandidateDocument } from '@/features/applications/types';

interface DocumentManagerProps {
  documents: CandidateDocument[];
  onUpload: (payload: { title: string; document_type: string; file_url: string; is_default: boolean }) => void;
  onDelete: (id: string) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, onUpload, onDelete }) => {
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('Resume');
  const [fileUrl, setFileUrl] = useState('');

  const handleSubmit = () => {
    onUpload({
      title: title || 'Candidate Document',
      document_type: docType,
      file_url: fileUrl || 'https://storage.kirmya.com/docs/default.pdf',
      is_default: docType === 'Resume',
    });
    setOpenModal(false);
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

      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} key={doc.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
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
                <IconButton onClick={() => onDelete(doc.id)} sx={{ color: 'error.main' }}>
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
                <Button size="small" variant="text" component="a" href={doc.file_url} target="_blank">
                  View File
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Candidate Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Document Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Staff Engineer Resume 2026"
            />
            <TextField select label="Document Type" fullWidth value={docType} onChange={(e) => setDocType(e.target.value)}>
              <MenuItem value="Resume">Resume</MenuItem>
              <MenuItem value="Cover Letter">Cover Letter</MenuItem>
              <MenuItem value="Certificate">Certificate</MenuItem>
              <MenuItem value="Portfolio">Portfolio</MenuItem>
            </TextField>
            <TextField
              label="File URL"
              fullWidth
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://storage.kirmya.com/my-resume.pdf"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
