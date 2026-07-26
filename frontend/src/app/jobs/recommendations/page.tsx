'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
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
  CircularProgress,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentsIcon from '@mui/icons-material/Payments';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useColorMode } from '../../providers';
import { recommendationApi } from '../../../features/recommendation/services/recommendationApi';

interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMax: number;
  currency: string;
  industry: string;
  requiredSkills: string[];
}

interface JobRecommendation {
  id: string;
  userId: string;
  jobId: string;
  matchScore: number;
  matchReasons: string; // JSON array string
  isActive: boolean;
  jobDetails?: JobDetails;
}

interface JobPreferences {
  preferredTitles: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  minSalary: number;
  currency: string;
}

export default function JobRecommendationsPage() {
  const { mode, toggleColorMode } = useColorMode();
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [preferences, setPreferences] = useState<JobPreferences>({
    preferredTitles: [],
    preferredLocations: [],
    preferredIndustries: [],
    minSalary: 0,
    currency: 'AED',
  });
  const [loading, setLoading] = useState(true);
  const [prefOpen, setPrefOpen] = useState(false);

  // Pref forms
  const [prefTitlesText, setPrefTitlesText] = useState('');
  const [prefLocsText, setPrefLocsText] = useState('');
  const [prefIndsText, setPrefIndsText] = useState('');
  const [prefMinSalary, setPrefMinSalary] = useState(0);
  const [prefCurrency, setPrefCurrency] = useState('AED');

  // Success alert
  const [alertMsg, setAlertMsg] = useState('');

  const fetchRecommendationsList = async () => {
    try {
      setLoading(true);
      const list = await recommendationApi.getRecommendations();
      setRecommendations(list);

      const pref = await recommendationApi.getPreferences();
      setPreferences({
        preferredTitles: pref.preferredTitles || [],
        preferredLocations: pref.preferredLocations || [],
        preferredIndustries: pref.preferredIndustries || [],
        minSalary: pref.minSalary || 0,
        currency: pref.currency || 'AED',
      });
      setPrefTitlesText((pref.preferredTitles || []).join(', '));
      setPrefLocsText((pref.preferredLocations || []).join(', '));
      setPrefIndsText((pref.preferredIndustries || []).join(', '));
      setPrefMinSalary(pref.minSalary || 0);
      setPrefCurrency(pref.currency || 'AED');
    } catch (err) {
      console.warn('Backend not running or schema unapplied, using client-side mock sandbox data.');
      // Load fallback mock data
      const mockJobs: JobDetails[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Senior Go Backend Engineer',
          company: 'Kirmya Technology',
          location: 'Dubai',
          salaryMax: 25000,
          currency: 'AED',
          industry: 'Technology',
          requiredSkills: ['Go', 'PostgreSQL', 'Redis'],
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Lead React / Next.js Developer',
          company: 'E-Commerce Solutions',
          location: 'Abu Dhabi',
          salaryMax: 20000,
          currency: 'AED',
          industry: 'Technology',
          requiredSkills: ['Next.js', 'MUI v6', 'React'],
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          title: 'Machine Learning / AI Developer',
          company: 'Gemini Labs',
          location: 'Dubai',
          salaryMax: 30000,
          currency: 'AED',
          industry: 'Finance',
          requiredSkills: ['Python', 'Vertex AI', 'pgvector'],
        },
      ];

      const mockRecs: JobRecommendation[] = [
        {
          id: 'rec-uuid-1',
          userId: recommendationApi.getMockUserId(),
          jobId: mockJobs[0].id,
          matchScore: 98,
          matchReasons: `["Matches your target job titles", "Matches 3 of your core skills (Go, PostgreSQL, Redis)", "Located in your preferred city (Dubai)", "Meets your salary expectations"]`,
          isActive: true,
          jobDetails: mockJobs[0],
        },
        {
          id: 'rec-uuid-2',
          userId: recommendationApi.getMockUserId(),
          jobId: mockJobs[1].id,
          matchScore: 75,
          matchReasons: `["Matches 2 of your core skills (Next.js, React)", "Located in your preferred city (Abu Dhabi)", "Meets your salary expectations"]`,
          isActive: true,
          jobDetails: mockJobs[1],
        },
        {
          id: 'rec-uuid-3',
          userId: recommendationApi.getMockUserId(),
          jobId: mockJobs[2].id,
          matchScore: 40,
          matchReasons: `["Matches your preferred location (Dubai)", "Meets your salary expectations"]`,
          isActive: true,
          jobDetails: mockJobs[2],
        },
      ];

      setRecommendations(mockRecs);
      const mockPref: JobPreferences = {
        preferredTitles: ['Go Developer', 'Software Engineer'],
        preferredLocations: ['Dubai', 'Abu Dhabi'],
        preferredIndustries: ['Technology', 'Finance'],
        minSalary: 15000,
        currency: 'AED',
      };
      setPreferences(mockPref);
      setPrefTitlesText(mockPref.preferredTitles.join(', '));
      setPrefLocsText(mockPref.preferredLocations.join(', '));
      setPrefIndsText(mockPref.preferredIndustries.join(', '));
      setPrefMinSalary(mockPref.minSalary);
      setPrefCurrency(mockPref.currency);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendationsList();
  }, []);

  const handleUpdatePreferences = async () => {
    const titles = prefTitlesText.split(',').map((t: string) => t.trim()).filter(Boolean);
    const locs = prefLocsText.split(',').map((l: string) => l.trim()).filter(Boolean);
    const inds = prefIndsText.split(',').map((i: string) => i.trim()).filter(Boolean);

    try {
      const updated = await recommendationApi.updatePreferences({
        preferredTitles: titles,
        preferredLocations: locs,
        preferredIndustries: inds,
        minSalary: prefMinSalary,
        currency: prefCurrency,
      });
      setPreferences({
        preferredTitles: updated.preferredTitles,
        preferredLocations: updated.preferredLocations,
        preferredIndustries: updated.preferredIndustries,
        minSalary: updated.minSalary,
        currency: updated.currency,
      });
      setPrefOpen(false);
      setAlertMsg('Job preferences saved successfully. Regenerating matches...');
      setTimeout(() => setAlertMsg(''), 4000);
      fetchRecommendationsList();
    } catch (err) {
      const mockUpdated: JobPreferences = {
        preferredTitles: titles,
        preferredLocations: locs,
        preferredIndustries: inds,
        minSalary: prefMinSalary,
        currency: prefCurrency,
      };
      setPreferences(mockUpdated);
      setPrefOpen(false);
      setAlertMsg('Job preferences saved successfully. Regenerating matches...');
      setTimeout(() => setAlertMsg(''), 4000);
    }
  };

  const handleFeedback = async (id: string, type: 'like' | 'dislike' | 'dismiss') => {
    try {
      await recommendationApi.submitFeedback(id, type);
      if (type === 'dislike' || type === 'dismiss') {
        setRecommendations(recommendations.filter((rec: JobRecommendation) => rec.id !== id));
      }
      setAlertMsg(`Feedback logged: ${type.toUpperCase()}`);
      setTimeout(() => setAlertMsg(''), 3000);
    } catch (err) {
      if (type === 'dislike' || type === 'dismiss') {
        setRecommendations(recommendations.filter((rec: JobRecommendation) => rec.id !== id));
      }
      setAlertMsg(`Feedback logged: ${type.toUpperCase()}`);
      setTimeout(() => setAlertMsg(''), 3000);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald Green
    if (score >= 50) return '#f59e0b'; // Amber Gold
    return '#ef4444'; // Red
  };

  const parseReasons = (reasonsJson: string) => {
    try {
      const arr = JSON.parse(reasonsJson);
      if (Array.isArray(arr)) {
        return (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {arr.map((reason: string, i: number) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon color="secondary" sx={{ fontSize: 14 }} />
                <Typography variant="caption" color="text.secondary">{reason}</Typography>
              </Box>
            ))}
          </Stack>
        );
      }
    } catch (e) {
      // Return raw
    }
    return <Typography variant="caption" color="text.secondary">{reasonsJson}</Typography>;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 10, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }}>Loading Personalized Job Matches...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, background: mode === 'light' ? 'linear-gradient(135deg, #eef2f6 0%, #cbd5e1 100%)' : 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)' }}>
      
      {/* Global Header Bar */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Card sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KIRMYA JOB RECOMMENDATION SYSTEM
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<SettingsIcon />} variant="outlined" onClick={() => setPrefOpen(true)}>
              Target Preferences
            </Button>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Stack>
        </Card>
      </Container>

      {/* Main Container */}
      <Container maxWidth="lg">
        {alertMsg && <Alert severity="success" sx={{ mb: 3 }}>{alertMsg}</Alert>}
        
        <Grid container spacing={3}>
          
          {/* Left Column: Preferences Overview */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Job Preferences</Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Target Titles</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {preferences.preferredTitles.map((title: string, i: number) => (
                        <Chip key={i} label={title} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Target Locations</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {preferences.preferredLocations.map((loc: string, i: number) => (
                        <Chip key={i} label={loc} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Target Industries</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {preferences.preferredIndustries.map((ind: string, i: number) => (
                        <Chip key={i} label={ind} size="small" color="secondary" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Expected Minimum Salary</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {preferences.minSalary.toLocaleString()} {preferences.currency} / month
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Recommendations Stream */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Personalized Matching Openings</Typography>
              
              {recommendations.length === 0 ? (
                <Alert severity="info">No recommendations match your current parameters. Expand your preferred locations or industries to discover more opportunities.</Alert>
              ) : (
                recommendations.map((rec: JobRecommendation) => {
                  const job = rec.jobDetails;
                  if (!job) return null;
                  return (
                    <Card key={rec.id} sx={{ position: 'relative', overflow: 'visible' }}>
                      
                      {/* Frosted Match score indicator */}
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: -15, 
                          right: 20, 
                          backgroundColor: getMatchScoreColor(rec.matchScore), 
                          color: 'white', 
                          px: 2, 
                          py: 0.5, 
                          borderRadius: '12px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      >
                        {rec.matchScore}% MATCH
                      </Box>

                      <CardContent sx={{ pt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{job.title}</Typography>
                        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mt: 0.5 }}>{job.company}</Typography>

                        <Stack direction="row" spacing={3} sx={{ mt: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{job.location}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PaymentsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{job.salaryMax.toLocaleString()} {job.currency} / month</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{job.industry}</Typography>
                          </Box>
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Match Explanations */}
                        <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.01)', border: '1px solid rgba(0,0,0,0.03)' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AutoAwesomeIcon color="secondary" sx={{ fontSize: 14 }} /> MATCH ANALYSIS DETAILS
                          </Typography>
                          {parseReasons(rec.matchReasons)}
                        </Box>

                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {job.requiredSkills.map((skill: string, i: number) => (
                              <Chip key={i} label={skill} size="small" variant="filled" color="primary" sx={{ opacity: 0.85 }} />
                            ))}
                          </Box>
                          
                          {/* Feedback options */}
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Helpful Recommendation">
                              <IconButton onClick={() => handleFeedback(rec.id, 'like')} color="primary" size="small">
                                <ThumbUpIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Not Relevant">
                              <IconButton onClick={() => handleFeedback(rec.id, 'dislike')} color="error" size="small">
                                <ThumbDownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Dismiss">
                              <IconButton onClick={() => handleFeedback(rec.id, 'dismiss')} size="small">
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
      </Container>

      {/* ----------------- DIALOG MODALS ----------------- */}

      {/* Edit Job Preferences Modal */}
      <Dialog open={prefOpen} onClose={() => setPrefOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Target Job Preferences</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField 
              label="Target Job Titles (comma separated)" 
              placeholder="Go Developer, Tech Lead" 
              fullWidth 
              value={prefTitlesText} 
              onChange={(e) => setPrefTitlesText(e.target.value)} 
            />
            <TextField 
              label="Preferred Locations (comma separated)" 
              placeholder="Dubai, Abu Dhabi" 
              fullWidth 
              value={prefLocsText} 
              onChange={(e) => setPrefLocsText(e.target.value)} 
            />
            <TextField 
              label="Preferred Industries (comma separated)" 
              placeholder="Technology, Finance" 
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
                  <Select value={prefCurrency} label="Currency" onChange={(e) => setPrefCurrency(e.target.value)}>
                    <MenuItem value="AED">AED</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrefOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdatePreferences} variant="contained">Regenerate Matches</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
