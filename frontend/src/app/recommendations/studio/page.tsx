'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';

import { recommendationApi } from '../../../features/recommendation_engine/api';
import {
  RecommendationItem,
  UnifiedRecommendationsResponse,
} from '../../../features/recommendation_engine/types';

export default function RecommendationStudioPage() {
  const [tabValue, setTabValue] = useState<number>(0);
  const [data, setData] = useState<UnifiedRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await recommendationApi.getUnifiedRecommendations();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (item: RecommendationItem, action: 'click' | 'save' | 'dismiss') => {
    try {
      await recommendationApi.trackEvent({
        item_type: item.item_type,
        item_id: item.item_id,
        action: action,
      });

      if (action === 'dismiss') {
        setFeedbackMsg(`Item "${item.title}" dismissed. ML weights updated for future recommendations.`);
      } else if (action === 'save') {
        setFeedbackMsg(`Saved "${item.title}" to your recommendations collection.`);
      } else {
        setFeedbackMsg(`Tracked interaction for "${item.title}". Model updated.`);
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getItemsForCurrentTab = (): RecommendationItem[] => {
    if (!data) return [];
    switch (tabValue) {
      case 1:
        return data.people;
      case 2:
        return data.communities;
      case 3:
        return data.courses;
      case 4:
        return data.events;
      case 5:
        return data.candidates;
      case 6:
        return data.talent_pools;
      default:
        return data.jobs;
    }
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#a855f7', p: 1.5, borderRadius: 2, color: '#fff', display: 'flex' }}>
              <AutoAwesomeIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #a855f7 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya Unified Recommendation Engine Studio
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                4-Stage ML-Ready Pipeline across Jobs, People, Communities, Courses, Events, Candidates, & Talent Pools
              </Typography>
            </Box>
          </Box>

          <Chip icon={<AutoAwesomeIcon />} label="ML MODEL v3.2-HYBRID ACTIVE" color="secondary" sx={{ fontWeight: 'bold' }} />
        </Box>

        {feedbackMsg && (
          <Alert severity="info" onClose={() => setFeedbackMsg(null)} sx={{ mb: 3, bgcolor: '#3b0764', color: '#e9d5ff' }}>
            {feedbackMsg}
          </Alert>
        )}

        {/* Multi-Domain Category Hub Tabs */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={(_, val) => setTabValue(val)}
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#a855f7' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#a855f7' },
            }}
          >
            <Tab icon={<WorkIcon fontSize="small" />} iconPosition="start" label="Recommended Jobs" />
            <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="Recommended Connections" />
            <Tab icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Recommended Communities" />
            <Tab icon={<SchoolIcon fontSize="small" />} iconPosition="start" label="Recommended Courses" />
            <Tab icon={<EventIcon fontSize="small" />} iconPosition="start" label="Recommended Events" />
            <Tab icon={<PersonSearchIcon fontSize="small" />} iconPosition="start" label="Top Candidates (Recruiters)" />
            <Tab icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Talent Pools (Recruiters)" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#a855f7' } }} />}

        {/* Recommendation Cards Grid */}
        <Grid container spacing={3}>
          {getItemsForCurrentTab().map((item) => (
            <Grid item xs={12} md={6} key={item.item_id}>
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip label={item.category_tag.toUpperCase()} size="small" sx={{ bgcolor: '#3b0764', color: '#e9d5ff', fontWeight: 'bold' }} />

                    <Chip
                      icon={<AutoAwesomeIcon fontSize="small" />}
                      label={`${item.match_score}% MATCH`}
                      color="secondary"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 0.5 }}>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 'bold', mb: 2 }}>
                    {item.subtitle}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2.5, lineHeight: 1.6 }}>
                    {item.description}
                  </Typography>

                  {/* ML Rationale & Feature Vector */}
                  <Box sx={{ bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2, p: 2, mb: 3, mt: 'auto' }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#a855f7', display: 'block', mb: 0.5 }}>
                      💡 ML Recommendation Rationale:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f8fafc', mb: 1.5 }}>
                      {item.match_rationale}
                    </Typography>

                    {/* Normalized Vector Display */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', mr: 0.5 }}>Vector:</Typography>
                      {item.feature_vector.slice(0, 6).map((val, idx) => (
                        <Chip key={idx} label={val.toFixed(2)} size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#334155', color: '#38bdf8' }} />
                      ))}
                    </Box>
                  </Box>

                  {/* Interactive Feedback Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ThumbUpIcon />}
                      onClick={() => handleFeedback(item, 'click')}
                      sx={{ bgcolor: '#a855f7', color: '#fff', fontWeight: 'bold', flex: 1 }}
                    >
                      Relevant
                    </Button>

                    <Tooltip title="Save to Collection">
                      <IconButton onClick={() => handleFeedback(item, 'save')} sx={{ color: '#38bdf8', border: '1px solid #334155' }}>
                        <BookmarkIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Dismiss & Lower Weight">
                      <IconButton onClick={() => handleFeedback(item, 'dismiss')} sx={{ color: '#f43f5e', border: '1px solid #334155' }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
