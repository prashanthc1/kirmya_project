'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Stack,
  Alert,
  Tooltip,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentsIcon from '@mui/icons-material/Payments';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';

import { AuthenticatedLayout } from '../../../components/shell';
import { recommendationApi } from '../../../features/recommendation/services/recommendationApi';
import { JobRecommendation, UserJobPreferences } from '../../../features/recommendation/types';
import { tokens } from '../../../theme/tokens';
import { EmptyState, ErrorState } from '../../../components/common';
import { ROUTES } from '../../../shared/routes';

export default function JobRecommendationsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [preferences, setPreferences] = useState<UserJobPreferences>({
    preferredTitles: [],
    preferredLocations: [],
    preferredIndustries: [],
    minSalary: 0,
    currency: 'AED',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefOpen, setPrefOpen] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  // Pref form state
  const [prefTitlesText, setPrefTitlesText] = useState('');
  const [prefLocsText, setPrefLocsText] = useState('');
  const [prefIndsText, setPrefIndsText] = useState('');
  const [prefMinSalary, setPrefMinSalary] = useState(0);
  const [prefCurrency, setPrefCurrency] = useState('AED');

  // Feedback status
  const [alertMsg, setAlertMsg] = useState<{ severity: 'success' | 'info' | 'error'; text: string } | null>(null);

  const fetchRecommendationsList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [list, pref] = await Promise.all([
        recommendationApi.getRecommendations({ limit: 20 }),
        recommendationApi.getPreferences().catch(() => ({
          preferredTitles: [],
          preferredLocations: [],
          preferredIndustries: [],
          minSalary: 0,
          currency: 'AED',
        })),
      ]);

      setRecommendations(list || []);
      setPreferences(pref);
      setPrefTitlesText((pref.preferredTitles || []).join(', '));
      setPrefLocsText((pref.preferredLocations || []).join(', '));
      setPrefIndsText((pref.preferredIndustries || []).join(', '));
      setPrefMinSalary(pref.minSalary || 0);
      setPrefCurrency(pref.currency || 'AED');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendationsList();
  }, [fetchRecommendationsList]);

  const handleUpdatePreferences = async () => {
    const titles = prefTitlesText.split(',').map((t) => t.trim()).filter(Boolean);
    const locs = prefLocsText.split(',').map((l) => l.trim()).filter(Boolean);
    const inds = prefIndsText.split(',').map((i) => i.trim()).filter(Boolean);

    try {
      setSavingPref(true);
      const updated = await recommendationApi.updatePreferences({
        preferredTitles: titles,
        preferredLocations: locs,
        preferredIndustries: inds,
        minSalary: prefMinSalary,
        currency: prefCurrency,
      });

      setPreferences(updated);
      setPrefOpen(false);
      setAlertMsg({ severity: 'success', text: 'Career preferences saved. Recalculating job matches...' });
      setTimeout(() => setAlertMsg(null), 4000);
      fetchRecommendationsList();
    } catch (err: any) {
      setAlertMsg({
        severity: 'error',
        text: err?.response?.data?.error || 'Could not save preferences. Please try again.',
      });
    } finally {
      setSavingPref(false);
    }
  };

  const handleFeedback = async (id: string, type: 'like' | 'dislike' | 'dismiss' | 'save') => {
    try {
      if (type === 'dislike' || type === 'dismiss') {
        setRecommendations((prev) => prev.filter((rec) => rec.id !== id));
      }
      await recommendationApi.submitFeedback(id, type);
      setAlertMsg({ severity: 'info', text: `Feedback logged: ${type.toUpperCase()}` });
      setTimeout(() => setAlertMsg(null), 3000);
    } catch {
      // Ignored
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 50) return theme.palette.warning.main;
    return theme.palette.primary.main;
  };

  const parseReasons = (reasonsJson: string) => {
    try {
      const arr = JSON.parse(reasonsJson);
      if (Array.isArray(arr)) {
        return (
          <Stack spacing={0.75} sx={{ mt: 1 }}>
            {arr.map((reason: string, i: number) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon color="secondary" sx={{ fontSize: 13 }} />
                <Typography variant="caption" color="text.secondary">
                  {reason}
                </Typography>
              </Box>
            ))}
          </Stack>
        );
      }
    } catch {
      // Fallback
    }
    return (
      <Typography variant="caption" color="text.secondary">
        {reasonsJson}
      </Typography>
    );
  };

  return (
    <AuthenticatedLayout maxWidth="wide">
      <Stack spacing={3}>
        {/* Header Bar */}
        <Card
          elevation={0}
          sx={{
            p: 3,
            borderRadius: `${tokens.radius.lg}px`,
            border: `1px solid ${
              isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
            }`,
            background: isDark
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              AI Job Recommendations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Personalized career matches powered by multi-factor scoring (Skills, Title, Location, Compensation, Industry).
            </Typography>
          </Box>
          <Button
            startIcon={<SettingsIcon />}
            variant="contained"
            onClick={() => setPrefOpen(true)}
            sx={{ borderRadius: `${tokens.radius.md}px`, fontWeight: 600 }}
          >
            Target Preferences
          </Button>
        </Card>

        {alertMsg && (
          <Alert severity={alertMsg.severity} sx={{ borderRadius: `${tokens.radius.md}px` }}>
            {alertMsg.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Preferences Overview */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                borderRadius: `${tokens.radius.lg}px`,
                border: `1px solid ${
                  isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
                }`,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Active Criteria
                  </Typography>
                  <Button size="small" onClick={() => setPrefOpen(true)}>
                    Edit
                  </Button>
                </Stack>

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Target Titles
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {(preferences.preferredTitles || []).length > 0 ? (
                        preferences.preferredTitles.map((title, i) => (
                          <Chip key={i} label={title} size="small" color="primary" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          No titles specified
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Target Locations
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {(preferences.preferredLocations || []).length > 0 ? (
                        preferences.preferredLocations.map((loc, i) => (
                          <Chip key={i} label={loc} size="small" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          All locations
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Target Industries
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {(preferences.preferredIndustries || []).length > 0 ? (
                        preferences.preferredIndustries.map((ind, i) => (
                          <Chip key={i} label={ind} size="small" color="secondary" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          All industries
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Expected Minimum Salary
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {preferences.minSalary > 0
                        ? `${preferences.minSalary.toLocaleString()} ${preferences.currency || 'AED'} / month`
                        : 'No minimum set'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Recommendations Stream */}
          <Grid item xs={12} md={8}>
            <Stack spacing={2.5}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Matched Opportunities ({recommendations.length})
              </Typography>

              {loading ? (
                <Stack spacing={2}>
                  <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                  <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                  <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                </Stack>
              ) : error ? (
                <ErrorState
                  title="Could not load recommendations"
                  message={error}
                  onRetry={fetchRecommendationsList}
                />
              ) : recommendations.length === 0 ? (
                <EmptyState
                  title="No job recommendations found"
                  description="Try broadening your target titles, locations, or salary expectations to see more matches."
                  actionLabel="Adjust Preferences"
                  onAction={() => setPrefOpen(true)}
                />
              ) : (
                recommendations.map((rec) => {
                  const job = rec.jobDetails;
                  if (!job) return null;
                  const scoreColor = getMatchScoreColor(rec.matchScore);

                  return (
                    <Card
                      key={rec.id}
                      elevation={0}
                      sx={{
                        position: 'relative',
                        borderRadius: `${tokens.radius.lg}px`,
                        border: `1px solid ${
                          isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
                        }`,
                        background: isDark
                          ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.6) 100%)'
                          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                        backdropFilter: 'blur(16px)',
                        transition: 'all 200ms ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: alpha(scoreColor, 0.3),
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack spacing={1.5}>
                          {/* Header row with Match Badge */}
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography
                                component={Link}
                                href={ROUTES.JOB_DETAIL(job.id)}
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  color: 'text.primary',
                                  '&:hover': { color: theme.palette.primary.main },
                                }}
                              >
                                {job.title}
                              </Typography>
                              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                                {job.company || 'Verified Employer'}
                              </Typography>
                            </Box>

                            <Chip
                              icon={<AutoAwesomeIcon sx={{ fontSize: '13px !important' }} />}
                              label={`${rec.matchScore}% Match`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: alpha(scoreColor, isDark ? 0.2 : 0.1),
                                color: scoreColor,
                                border: `1px solid ${alpha(scoreColor, 0.3)}`,
                              }}
                            />
                          </Stack>

                          {/* Metadata row */}
                          <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {job.location || 'Remote'}
                              </Typography>
                            </Box>
                            {job.salaryMax > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PaymentsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {job.salaryMax.toLocaleString()} {job.currency || 'AED'} / month
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {job.industry || 'Technology'}
                              </Typography>
                            </Box>
                          </Stack>

                          {/* Match Analysis Details */}
                          {rec.matchReasons && (
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: `${tokens.radius.md}px`,
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)',
                                border: `1px solid ${
                                  isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)'
                                }`,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <AutoAwesomeIcon color="secondary" sx={{ fontSize: 13 }} /> MATCH ANALYSIS
                              </Typography>
                              {parseReasons(rec.matchReasons)}
                            </Box>
                          )}

                          {/* Skills and Feedback Row */}
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            flexWrap="wrap"
                            sx={{ gap: 1, pt: 1 }}
                          >
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {(job.requiredSkills || []).slice(0, 5).map((skill, i) => (
                                <Chip
                                  key={i}
                                  label={skill}
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.72rem',
                                    bgcolor: isDark
                                      ? 'rgba(255, 255, 255, 0.06)'
                                      : 'rgba(15, 23, 42, 0.04)',
                                  }}
                                />
                              ))}
                            </Box>

                            {/* Feedback options */}
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Helpful Recommendation">
                                <IconButton
                                  onClick={() => handleFeedback(rec.id, 'like')}
                                  color="primary"
                                  size="small"
                                >
                                  <ThumbUpIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Not Relevant">
                                <IconButton
                                  onClick={() => handleFeedback(rec.id, 'dislike')}
                                  color="error"
                                  size="small"
                                >
                                  <ThumbDownIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Dismiss">
                                <IconButton
                                  onClick={() => handleFeedback(rec.id, 'dismiss')}
                                  size="small"
                                  sx={{ color: 'text.secondary' }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Edit Preferences Dialog Modal */}
        <Dialog open={prefOpen} onClose={() => setPrefOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Configure Target Job Preferences</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Target Job Titles (comma separated)"
                placeholder="Senior Go Backend Architect, Staff Engineer"
                fullWidth
                value={prefTitlesText}
                onChange={(e) => setPrefTitlesText(e.target.value)}
              />
              <TextField
                label="Preferred Locations (comma separated)"
                placeholder="Dubai, Abu Dhabi, Remote"
                fullWidth
                value={prefLocsText}
                onChange={(e) => setPrefLocsText(e.target.value)}
              />
              <TextField
                label="Preferred Industries (comma separated)"
                placeholder="Technology, Financial Services, AI"
                fullWidth
                value={prefIndsText}
                onChange={(e) => setPrefIndsText(e.target.value)}
              />
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    label="Minimum Target Salary"
                    type="number"
                    fullWidth
                    value={prefMinSalary}
                    onChange={(e) => setPrefMinSalary(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={prefCurrency}
                      label="Currency"
                      onChange={(e) => setPrefCurrency(e.target.value)}
                    >
                      <MenuItem value="AED">AED</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setPrefOpen(false)} disabled={savingPref}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePreferences}
              variant="contained"
              disabled={savingPref}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600 }}
            >
              {savingPref ? 'Saving...' : 'Save & Recalculate'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </AuthenticatedLayout>
  );
}
