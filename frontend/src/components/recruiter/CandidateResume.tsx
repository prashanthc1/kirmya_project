'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Alert,
  Divider,
  Grid,
  LinearProgress,
  useTheme,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShieldIcon from '@mui/icons-material/Shield';

interface Props {
  candidateId: string;
  candidateName: string;
}

export const CandidateResume: React.FC<Props> = ({ candidateId, candidateName }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [auditLog, setAuditLog] = useState<string | null>(null);

  const handleDownload = () => {
    setAuditLog(`Resume Downloaded logged at ${new Date().toLocaleTimeString()} for recruiter privacy compliance.`);
  };

  const handleViewVersion = () => {
    setAuditLog(`Resume Version v2.4 viewed at ${new Date().toLocaleTimeString()}.`);
  };

  return (
    <Box>
      {auditLog && (
        <Alert severity="success" icon={<ShieldIcon />} sx={{ mb: 3, borderRadius: '12px' }}>
          <strong>Privacy Audit Logged:</strong> {auditLog}
        </Alert>
      )}

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {candidateName}'s Resume (PDF Version 2.4)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Uploaded on 2026-07-28 • Verified ATS Format Parse
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={handleViewVersion}
              sx={{ borderRadius: '12px', fontWeight: 800 }}
            >
              View Version
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              }}
            >
              Download PDF Resume
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* ATS Resume Analysis */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon /> Automated ATS Resume Analysis
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
              <Typography variant="caption" color="text.secondary">ATS Parsability Score</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main' }}>98/100</Typography>
              <LinearProgress variant="determinate" value={98} color="success" sx={{ mt: 1, height: 6, borderRadius: 3 }} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
              <Typography variant="caption" color="text.secondary">Skill Density Score</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>94/100</Typography>
              <LinearProgress variant="determinate" value={94} color="primary" sx={{ mt: 1, height: 6, borderRadius: 3 }} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
              <Typography variant="caption" color="text.secondary">Impact & Quantified Metrics</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'info.main' }}>90/100</Typography>
              <LinearProgress variant="determinate" value={90} color="info" sx={{ mt: 1, height: 6, borderRadius: 3 }} />
            </Box>
          </Grid>
        </Grid>

        {/* Resume Preview Text Document Container */}
        <Box
          sx={{
            p: 4,
            borderRadius: '16px',
            bgcolor: isDark ? '#0f172a' : '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            fontFamily: 'monospace',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{candidateName}</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Email: sarah.chen@example.com | Location: Dubai, UAE | LinkedIn: linkedin.com/in/sarahchen-go
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>PROFESSIONAL SUMMARY</Typography>
          <Typography variant="body2" paragraph>
            Staff Backend &amp; Cloud Architect with 8+ years building enterprise Go microservices, database optimizations, and resilient Kubernetes deployments.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>EXPERIENCE</Typography>
          <Typography variant="body2" paragraph>
            • Staff Engineer at CloudScale Technologies (2022 - Present): Reduced P99 PostgreSQL latency by 45%. Architected Go microservices handling 2M+ active HTTP requests daily.
          </Typography>
          <Typography variant="body2" paragraph>
            • Senior Backend Engineer at Apex Digital (2019 - 2022): Built distributed transaction pipelines in Go &amp; gRPC with zero downtime deployments.
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default CandidateResume;
