'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  Stack,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import CompareIcon from '@mui/icons-material/Compare';
import ShieldIcon from '@mui/icons-material/Shield';
import EmailIcon from '@mui/icons-material/Email';

export const AIRecruiterAssistant: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [prompt, setPrompt] = useState('Senior Microservices Golang Architect');
  const [activeTask, setActiveTask] = useState<string>('questions');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const capabilities = [
    { id: 'questions', label: 'Generate Interview Questions', icon: <QuizIcon fontSize="small" /> },
    { id: 'jd', label: 'Improve Job Description', icon: <DescriptionIcon fontSize="small" /> },
    { id: 'outreach', label: 'Draft Candidate Outreach Message', icon: <EmailIcon fontSize="small" /> },
    { id: 'compare', label: 'Compare Candidate to Job', icon: <CompareIcon fontSize="small" /> },
  ];

  const handleRunTask = (taskId: string) => {
    setActiveTask(taskId);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (taskId === 'questions') {
        setResult({
          title: 'Tailored Technical & Architectural Questions',
          content: [
            '1. SYSTEM ARCHITECTURE: "In your resume, you mention optimizing PostgreSQL P99 query latency by 45%. Walk us through how you identified index locks and restructured queries."',
            '2. CONCURRENCY: "How do you handle graceful shutdown and context propagation across worker pools in Go microservices?"',
            '3. LEADERSHIP: "Describe a scenario where you mentored junior developers on microservices architecture and code reviews."',
          ],
        });
      } else if (taskId === 'jd') {
        setResult({
          title: 'AI-Optimized Job Description Suggestions',
          content: [
            '# Senior Go Backend Architect',
            '## Role Overview: Lead high-scale payment pipelines and microservice architectures.',
            '## Key Responsibilities:',
            '- Architect low-latency REST & gRPC microservices in Go.',
            '- Optimize PostgreSQL connection pooling and GIN indexing.',
            '*(Note: Optimized for 24% higher candidate engagement & inclusive language)*',
          ],
        });
      } else if (taskId === 'outreach') {
        setResult({
          title: 'Personalized Candidate Outreach Email Draft',
          content: [
            'Subject: Senior Go Backend Architect Opportunity at Kirmya Partners',
            'Hi Sarah,',
            'I came across your profile and was extremely impressed by your experience building high-scale Go microservices and optimizing database latency.',
            'We are currently hiring a Senior Go Backend Architect. Given your background in cloud architecture, I believe this would be an exceptional match.',
            'Would you be open for a brief 15-minute conversation this week?',
            'Best regards,',
            'Kirmya Enterprise Recruiting Team',
          ],
        });
      } else {
        setResult({
          title: 'Candidate vs Job Requirements Matrix',
          content: [
            'Overall Fit Score: 96%',
            'Strengths: 8+ years Go experience, PostgreSQL GIN index tuning, Kubernetes operator design.',
            'Missing Requirements: Kafka Streaming (Minor).',
            'Explanation: Candidate matches 98% of core technical competencies for Senior Architect role.',
          ],
        });
      }
    }, 900);
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: { xs: 3, md: 4 },
        mb: 4,
        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <AutoAwesomeIcon sx={{ color: '#a855f7', fontSize: 36 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            AI Recruiting Assistant &amp; Co-Pilot
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assistive recruitment co-pilot for candidate summaries, message drafting, and question sets.
          </Typography>
        </Box>
      </Stack>

      <Alert severity="info" icon={<ShieldIcon />} sx={{ mb: 3, borderRadius: '12px' }}>
        <strong>Fair Hiring Assurance:</strong> AI tools never use protected characteristics, never fabricate candidate details, and never autonomously reject candidates. All recommendations are explainable and assistive.
      </Alert>

      {/* Task Capabilities Bar */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {capabilities.map((cap) => (
          <Button
            key={cap.id}
            variant={activeTask === cap.id ? 'contained' : 'outlined'}
            startIcon={cap.icon}
            onClick={() => handleRunTask(cap.id)}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              ...(activeTask === cap.id && {
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              }),
            }}
          >
            {cap.label}
          </Button>
        ))}
      </Stack>

      <TextField
        label="Role or Candidate Context Prompt"
        fullWidth
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ mb: 3 }}
      />

      {loading && <LinearProgress sx={{ borderRadius: 4, height: 6, mb: 3 }} />}

      {result && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '20px',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#a855f7', mb: 2 }}>
            {result.title}
          </Typography>
          <Stack spacing={1}>
            {result.content.map((line: string, i: number) => (
              <Typography key={i} variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                {line}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}
    </Card>
  );
};

export default AIRecruiterAssistant;
