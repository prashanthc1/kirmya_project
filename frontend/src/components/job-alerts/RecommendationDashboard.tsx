'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Drawer,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { JobRecommendation } from '@/features/job-alerts/types';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationReason } from './RecommendationReason';

interface RecommendationDashboardProps {
  recommendations: JobRecommendation[];
  onApply?: (rec: JobRecommendation) => void;
  onSaveToggle?: (rec: JobRecommendation) => void;
  onFeedback?: (rec: JobRecommendation, action: string, reason?: string) => void;
}

export const RecommendationDashboard: React.FC<RecommendationDashboardProps> = ({
  recommendations,
  onApply,
  onSaveToggle,
  onFeedback,
}) => {
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [activeReasonRec, setActiveReasonRec] = useState<JobRecommendation | null>(null);

  const sections = ['ALL', 'Recommended For You', 'High Match Jobs', 'Based On Your Skills', 'Remote Jobs'];

  const filteredRecs = recommendations.filter((r) => {
    if (selectedSection === 'ALL') return true;
    return r.section_tag === selectedSection;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoAwesomeIcon sx={{ color: '#9933FF', fontSize: 36 }} /> AI Job Recommendation Workspace
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Personalized opportunities continuously optimized using your profile skills, career preferences, and activity vector.
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedSection}
          onChange={(_, val) => setSelectedSection(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {sections.map((sec) => (
            <Tab key={sec} label={sec} value={sec} sx={{ fontWeight: 600 }} />
          ))}
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {filteredRecs.map((rec) => (
          <Grid item xs={12} md={6} key={rec.id}>
            <RecommendationCard
              recommendation={rec}
              onApply={onApply}
              onSaveToggle={onSaveToggle}
              onViewDetails={(r) => setActiveReasonRec(r)}
              onFeedback={onFeedback}
            />
          </Grid>
        ))}
      </Grid>

      <Drawer
        anchor="right"
        open={Boolean(activeReasonRec)}
        onClose={() => setActiveReasonRec(null)}
        PaperProps={{
          sx: {
            width: { xs: '100%', md: 650 },
            background: 'rgba(18, 24, 38, 0.95)',
            backdropFilter: 'blur(20px)',
            p: 2,
          },
        }}
      >
        {activeReasonRec && <RecommendationReason recommendation={activeReasonRec} />}
      </Drawer>
    </Container>
  );
};
