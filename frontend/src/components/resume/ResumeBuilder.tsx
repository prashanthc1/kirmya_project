'use client';

import React, { useState } from 'react';
import { Container, Box, Typography, Grid, Paper, Button, TextField, Stack } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WorkIcon from '@mui/icons-material/Work';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useRouter } from 'next/navigation';

interface ResumeBuilderProps {
  onCreateResume: (title: string, template: string) => Promise<any>;
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ onCreateResume }) => {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'profile' | 'blank' | 'import' | 'job' | 'ai'>('profile');
  const [title, setTitle] = useState('Senior Full-Stack Engineer Resume');
  const [loading, setLoading] = useState(false);

  const methods = [
    {
      id: 'profile',
      title: 'Import From Kirmya Profile',
      desc: 'Auto-populate personal info, experience, education, skills, and certifications from your profile.',
      icon: <AccountCircleIcon sx={{ fontSize: 40, color: '#0066FF' }} />,
    },
    {
      id: 'blank',
      title: 'Start Blank Resume',
      desc: 'Build a custom resume section by section from scratch with ATS-friendly templates.',
      icon: <NoteAddIcon sx={{ fontSize: 40, color: '#00CC66' }} />,
    },
    {
      id: 'import',
      title: 'Import Existing PDF / DOCX',
      desc: 'Upload a PDF or Word document to parse and extract resume sections automatically.',
      icon: <CloudUploadIcon sx={{ fontSize: 40, color: '#9933FF' }} />,
    },
    {
      id: 'job',
      title: 'Job-Specific Tailored Resume',
      desc: 'Target a specific job description for maximum ATS score and keyword matching.',
      icon: <WorkIcon sx={{ fontSize: 40, color: '#FF9900' }} />,
    },
    {
      id: 'ai',
      title: 'AI-Assisted Resume Generator',
      desc: 'Let Kirmya AI draft your bullet points, summary, and achievements based on your target role.',
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: '#FF3366' }} />,
    },
  ];

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await onCreateResume(title, 'classic');
      router.push(`/dashboard/resumes/${res.id}/edit`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ textCenter: 'center', mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Create New Professional Resume
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Select how you would like to generate your ATS-optimized resume document.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Resume Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 4 }}
        />

        <Grid container spacing={3}>
          {methods.map((m) => {
            const isSelected = selectedMethod === m.id;
            return (
              <Grid item xs={12} md={6} key={m.id}>
                <Paper
                  elevation={0}
                  onClick={() => setSelectedMethod(m.id as any)}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(0, 102, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '2px solid #0066FF' : '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>{m.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {m.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {m.desc}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => router.back()} sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 700 }}>
          Cancel
        </Button>
        <Button variant="contained" size="large" onClick={handleCreate} disabled={loading} sx={{ borderRadius: 2, px: 5, fontWeight: 800 }}>
          {loading ? 'Creating Resume...' : 'Continue To Editor'}
        </Button>
      </Box>
    </Container>
  );
};
