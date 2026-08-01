'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Stack,
  Paper,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GlassCard from '../landing/GlassCard';

export const AIRecruiterAssistant: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [prompt, setPrompt] = useState('Senior Microservices Golang Engineer in Dubai');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResult({
        jd: 'We are looking for a Senior Golang Engineer to design resilient microservice systems, optimize SQL queries, and deploy Kubernetes clusters.',
        questions: [
          'How do you manage goroutine memory leaks under high concurrent traffic?',
          'Walk us through your approach to PostgreSQL connection pooling with pgxpool.',
          'Describe a scenario where you implemented circuit breaker patterns in Gin microservices.',
        ],
        matchInsight: 'Candidate Sarah Chen ranks #1 with 96% ATS skill score for this role.',
      });
    }, 1000);
  };

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <AutoAwesomeIcon sx={{ color: '#a855f7', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          AI Hiring Assistant &amp; Co-Pilot
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Instantly generate job descriptions, interview question sets, candidate ranking summaries, and ATS match analysis.
      </Typography>

      <Stack spacing={2} sx={{ mb: 4 }}>
        <TextField
          label="Enter Role or Candidate Prompt *"
          fullWidth
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Facilities Operations Director in Abu Dhabi"
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleGenerate}
          disabled={loading}
          startIcon={<AutoAwesomeIcon />}
          sx={{
            py: 1.4,
            px: 4,
            borderRadius: '12px',
            fontWeight: 800,
            textTransform: 'none',
            alignSelf: 'flex-start',
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
          }}
        >
          {loading ? 'AI Co-Pilot Working...' : 'Generate AI Recruitment Content'}
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ borderRadius: 4, height: 6, mb: 4 }} />}

      {result && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#a855f7', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon /> Generated Job Description
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {result.jd}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <QuizIcon /> Tailored Technical Interview Questions
              </Typography>

              <Stack spacing={1}>
                {result.questions.map((q: string, idx: number) => (
                  <Typography key={idx} variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.4 }}>
                    {idx + 1}. {q}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </GlassCard>
  );
};

export default AIRecruiterAssistant;
