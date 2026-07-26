'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Slider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import HistoryIcon from '@mui/icons-material/History';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CardMembershipIcon from '@mui/icons-material/CardMembership';

import { useColorMode } from '../../providers';
import { candidateSearchApi } from '../../../features/recruiter/services/candidateSearchApi';

interface CandidateResult {
  candidateId: string;
  name: string;
  email: string;
  headline: string;
  summary: string;
  location: string;
  skills: string[];
  experienceYrs: number;
  salaryExpect: number;
  availability: string;
  matchScore: number;
  education?: string;
  certifications?: string[];
  industry?: string;
}

interface SavedItem {
  id: string;
  candidateId: string;
  candidateName: string;
  listName: string;
}

interface RecruiterNote {
  id: string;
  notes: string;
  createdAt: string;
}

export default function CandidateSearchPage() {
  const { mode, toggleColorMode } = useColorMode();

  // Search Criteria States
  const [query, setQuery] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [expRange, setExpRange] = useState<number[]>([1, 15]);
  const [locFilter, setLocFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState<number[]>([10000, 50000]);
  const [eduFilter, setEduFilter] = useState('');
  const [certFilter, setCertFilter] = useState('');
  const [indFilter, setIndFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');

  // Operations States
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [savedLists, setSavedLists] = useState<SavedItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Modal Dialogs States
  const [openSave, setOpenSave] = useState(false);
  const [selectedCand, setSelectedCand] = useState<CandidateResult | null>(null);
  const [listName, setListName] = useState('General Pipeline');
  const [savingBookmark, setSavingBookmark] = useState(false);

  const [openNote, setOpenNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [candNotesList, setCandNotesList] = useState<RecruiterNote[]>([]);
  const [savingNote, setSavingNote] = useState(false);

  const [openContact, setOpenContact] = useState(false);
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [sendingMail, setSendingMail] = useState(false);

  useEffect(() => {
    document.title = "Talent Finder | Kirmya LinkedIn Recruiter Search";
    handleSearch();
  }, []);

  const handleSearch = async () => {
    const skillsArray = skillsFilter.split(',').map(s => s.trim()).filter(s => s !== '');
    const certsArray = certFilter.split(',').map(s => s.trim()).filter(s => s !== '');

    const criteria = {
      query,
      filters: {
        skills: skillsArray,
        experienceMin: expRange[0],
        experienceMax: expRange[1],
        location: locFilter,
        availability: availFilter === 'all' ? '' : availFilter,
        salaryMin: salaryFilter[0],
        salaryMax: salaryFilter[1],
        education: eduFilter,
        certifications: certsArray,
        industry: indFilter,
        jobTitle: titleFilter,
      },
    };

    try {
      setLoading(true);
      const data = await candidateSearchApi.searchCandidates(criteria);
      setResults(data || []);

      const saved = await candidateSearchApi.getSavedCandidates();
      setSavedLists(saved || []);

      const hist = await candidateSearchApi.getHistory();
      setHistory(hist || []);
    } catch (err) {
      console.warn('Backend server unreachable. Enabling candidate search sandbox simulator.');
      setIsSandboxMode(true);

      // Preloaded sandbox database search results
      const mockCatalog: CandidateResult[] = [
        {
          candidateId: 'cand-1',
          name: "Salim Al-Harthy",
          email: "salim.h@kirmya.ae",
          headline: "Principal Go & Distributed Monolith Architect",
          summary: "10+ years scaling APIs, caching with Redis, configuring docker stacks.",
          location: "Dubai, UAE",
          skills: ["Go", "Redis", "Docker", "PostgreSQL"],
          experienceYrs: 11,
          salaryExpect: 32000,
          availability: "active",
          matchScore: 98,
          education: "B.Sc. Computer Science",
          certifications: ["AWS Solutions Architect", "Docker Certified"],
          industry: "Technology",
        },
        {
          candidateId: 'cand-2',
          name: "Sarah Al-Said",
          email: "sarah.s@kirmya.ae",
          headline: "Lead DevOps Engineer & CI/CD Pipelines Leader",
          summary: "Expert in Nixpacks, Railway, OpenTelemetry monitoring metrics.",
          location: "Muscat, Oman",
          skills: ["Docker", "Nixpacks", "OpenTelemetry", "GitHub Actions"],
          experienceYrs: 6,
          salaryExpect: 24000,
          availability: "passive",
          matchScore: 91,
          education: "Master of Engineering",
          certifications: ["CKA Certified Kubernetes"],
          industry: "Infrastructure",
        },
        {
          candidateId: 'cand-3',
          name: "Fatima Al-Kamali",
          email: "fatima.k@kirmya.ae",
          headline: "Senior UI/UX Developer & MUI v6 styling expert",
          summary: "Responsive design templates layout, SVG dashboards rendering.",
          location: "Abu Dhabi, UAE",
          skills: ["Next.js", "MUI", "React", "TypeScript"],
          experienceYrs: 5,
          salaryExpect: 21000,
          availability: "active",
          matchScore: 89,
          education: "B.Sc. Software Engineering",
          certifications: ["Meta Frontend Professional"],
          industry: "Technology",
        },
        {
          candidateId: 'cand-4',
          name: "Tariq Al-Balushi",
          email: "tariq.b@kirmya.ae",
          headline: "Staff Security Auditor & Compliance Architect",
          summary: "Specialized in JWT token rotation, rate limiting, SQL injection audits.",
          location: "Dubai, UAE",
          skills: ["Security", "JWT", "PostgreSQL", "Gin"],
          experienceYrs: 9,
          salaryExpect: 42000,
          availability: "active",
          matchScore: 94,
          education: "Master of Science in Cybersecurity",
          certifications: ["CISSP", "CEH"],
          industry: "Finance",
        },
      ];

      // Perform local filtering based on facets
      const filtered = mockCatalog.filter(c => {
        let match = true;
        if (query) {
          const q = query.toLowerCase();
          match = c.name.toLowerCase().includes(q) || c.headline.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q);
        }
        if (skillsFilter) {
          const needed = skillsArray.map(s => s.toLowerCase());
          match = match && needed.every(s => c.skills.map(k => k.toLowerCase()).includes(s));
        }
        if (locFilter) {
          match = match && c.location.toLowerCase().includes(locFilter.toLowerCase());
        }
        if (titleFilter) {
          match = match && c.headline.toLowerCase().includes(titleFilter.toLowerCase());
        }
        if (availFilter !== 'all') {
          match = match && c.availability === availFilter;
        }
        if (eduFilter) {
          match = match && !!c.education && c.education.toLowerCase().includes(eduFilter.toLowerCase());
        }
        if (indFilter) {
          match = match && !!c.industry && c.industry.toLowerCase().includes(indFilter.toLowerCase());
        }
        // Check ranges
        match = match && c.experienceYrs >= expRange[0] && c.experienceYrs <= expRange[1];
        match = match && c.salaryExpect >= salaryFilter[0] && c.salaryExpect <= salaryFilter[1];

        return match;
      });

      setResults(filtered);
      setHistory([
        { query: 'Go Developer', filters: { skills: ['Go'] } },
        { query: 'DevOps Dubai', filters: { location: 'Dubai' } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Open bookmark save dialog
  const handleOpenSaveDialog = (cand: CandidateResult) => {
    setSelectedCand(cand);
    setListName('Talent Pipeline');
    setOpenSave(true);
  };

  // Save Bookmark Action
  const handleSaveBookmark = async () => {
    if (!selectedCand) return;
    setSavingBookmark(true);

    try {
      if (isSandboxMode) {
        const newItem: SavedItem = {
          id: Math.random().toString(),
          candidateId: selectedCand.candidateId,
          candidateName: selectedCand.name,
          listName,
        };
        setSavedLists(prev => [newItem, ...prev]);
        setOpenSave(false);
      } else {
        await candidateSearchApi.saveCandidate({
          candidateId: selectedCand.candidateId,
          listName,
        });
        const saved = await candidateSearchApi.getSavedCandidates();
        setSavedLists(saved || []);
        setOpenSave(false);
      }
    } catch (err) {
      // Ignored
    } finally {
      setSavingBookmark(false);
    }
  };

  // Open Recruiter Notes drawer Dialog
  const handleOpenNoteDialog = async (cand: CandidateResult) => {
    setSelectedCand(cand);
    setNoteText('');
    setOpenNote(true);

    try {
      if (isSandboxMode) {
        setCandNotesList([
          { id: '1', notes: "Spoke briefly; candidate represents strong backend architecture capabilities.", createdAt: '24 hours ago' }
        ]);
      } else {
        const notes = await candidateSearchApi.getNotes(cand.candidateId);
        setCandNotesList(notes || []);
      }
    } catch (err) {
      // Ignored
    }
  };

  // Add Recruiter Note Submit
  const handleAddNoteSubmit = async () => {
    if (!selectedCand || !noteText.trim()) return;
    setSavingNote(true);

    try {
      if (isSandboxMode) {
        const newNote: RecruiterNote = {
          id: Math.random().toString(),
          notes: noteText,
          createdAt: 'Just now',
        };
        setCandNotesList(prev => [newNote, ...prev]);
        setNoteText('');
      } else {
        await candidateSearchApi.addNote({
          candidateId: selectedCand.candidateId,
          notes: noteText,
        });
        const notes = await candidateSearchApi.getNotes(selectedCand.candidateId);
        setCandNotesList(notes || []);
        setNoteText('');
      }
    } catch (err) {
      // Ignored
    } finally {
      setSavingNote(false);
    }
  };

  // Open Contact drawer Dialog
  const handleOpenContactDialog = (cand: CandidateResult) => {
    setSelectedCand(cand);
    setMailSubject(`Kirmya Talent Outreach - Opportunity matching ${cand.headline}`);
    setMailBody(`Dear ${cand.name},\n\nI came across your profile on Kirmya's recruitment database. We are currently scouting for a ${cand.headline} with expertise in ${cand.skills.join(', ')}.\n\nLet us connect to discuss further!\n\nBest regards,\nRecruitment Team`);
    setOpenContact(true);
  };

  // Contact Outreach Submit
  const handleContactSubmit = async () => {
    if (!selectedCand) return;
    setSendingMail(true);

    try {
      if (!isSandboxMode) {
        await candidateSearchApi.contactCandidate({
          candidateId: selectedCand.candidateId,
          subject: mailSubject,
          body: mailBody,
        });
      }
      setOpenContact(false);
      alert(`Message successfully dispatched to ${selectedCand.name}!`);
    } catch (err) {
      // Ignored
    } finally {
      setSendingMail(false);
    }
  };

  // Load search from history cache
  const handleApplyHistory = (item: any) => {
    setQuery(item.query || '');
    if (item.filters) {
      setSkillsFilter(item.filters.skills?.join(', ') || '');
      setLocFilter(item.filters.location || '');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: mode === 'light' ? '#f3f2f0' : '#090d16',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Detail Header Bar */}
      <Box
        component="header"
        sx={{
          bgcolor: mode === 'light' ? 'white' : '#111827',
          borderBottom: '1px solid',
          borderColor: mode === 'light' ? '#e0e0e0' : '#1f2937',
          py: 1.5,
          px: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton sx={{ color: 'text.secondary' }} onClick={() => window.history.back()}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography component="h1" variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'light' ? '#1f2937' : '#f9fafb', lineHeight: 1.1 }}>
              LinkedIn Recruiter Talent Finder
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Advanced Candidate Search Engine
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {isSandboxMode && (
            <Chip
              label="SANDBOX MODE (OFFLINE)"
              color="error"
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
          <IconButton onClick={toggleColorMode} sx={{ color: 'text.secondary' }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Main Console Workspace */}
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Grid container spacing={3.5}>
          
          {/* Left Filters Panel Column */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                  <FilterListIcon color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                    Search Facets Filters
                  </Typography>
                </Stack>

                <Stack spacing={2.5}>
                  <TextField
                    label="Job Position Title"
                    placeholder="e.g. Lead DevOps"
                    size="small"
                    value={titleFilter}
                    onChange={(e) => setTitleFilter(e.target.value)}
                  />
                  <TextField
                    label="Skills (Comma-separated)"
                    placeholder="e.g. Go, Docker, Redis"
                    size="small"
                    value={skillsFilter}
                    onChange={(e) => setSkillsFilter(e.target.value)}
                  />
                  <TextField
                    label="Location Headquarters"
                    placeholder="e.g. Dubai, UAE"
                    size="small"
                    value={locFilter}
                    onChange={(e) => setLocFilter(e.target.value)}
                  />

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                      Experience Range (Years)
                    </Typography>
                    <Slider
                      value={expRange}
                      onChange={(e, val) => setExpRange(val as number[])}
                      valueLabelDisplay="auto"
                      min={0}
                      max={20}
                      sx={{ color: '#0a66c2' }}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">{expRange[0]} yrs</Typography>
                      <Typography variant="caption" color="text.secondary">{expRange[1]}+ yrs</Typography>
                    </Stack>
                  </Box>

                  <FormControl fullWidth size="small">
                    <InputLabel>Availability Status</InputLabel>
                    <Select
                      value={availFilter}
                      label="Availability Status"
                      onChange={(e) => setAvailFilter(e.target.value)}
                    >
                      <MenuItem value="all">Any Availability</MenuItem>
                      <MenuItem value="active">Actively Looking</MenuItem>
                      <MenuItem value="passive">Open to Opportunities</MenuItem>
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                      Expected Salary (AED Monthly)
                    </Typography>
                    <Slider
                      value={salaryFilter}
                      onChange={(e, val) => setSalaryFilter(val as number[])}
                      valueLabelDisplay="auto"
                      min={5000}
                      max={80000}
                      step={5000}
                      sx={{ color: '#0a66c2' }}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">AED {salaryFilter[0]}</Typography>
                      <Typography variant="caption" color="text.secondary">AED {salaryFilter[1]}</Typography>
                    </Stack>
                  </Box>

                  <TextField
                    label="Education Degree"
                    placeholder="e.g. Computer Science"
                    size="small"
                    value={eduFilter}
                    onChange={(e) => setEduFilter(e.target.value)}
                  />
                  <TextField
                    label="Certifications"
                    placeholder="e.g. AWS Solutions Architect"
                    size="small"
                    value={certFilter}
                    onChange={(e) => setCertFilter(e.target.value)}
                  />
                  <TextField
                    label="Industry Sector"
                    placeholder="e.g. Technology"
                    size="small"
                    value={indFilter}
                    onChange={(e) => setIndFilter(e.target.value)}
                  />

                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    sx={{ textTransform: 'none', fontWeight: 800, bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
                  >
                    Apply Filters
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Results Panel Column */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3.5}>
              
              {/* Keyword Query Search bar card */}
              <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Keyword full-text search across resumes and bios..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.25rem' }} />
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      sx={{ textTransform: 'none', fontWeight: 800, px: 4, bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
                    >
                      Search
                    </Button>
                  </Stack>

                  {/* Search History cache links */}
                  {history.length > 0 && (
                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <HistoryIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                      <Typography variant="caption" color="text.secondary">Recent searches:</Typography>
                      {history.map((hist, idx) => (
                        <Chip
                          key={idx}
                          label={hist.query}
                          size="small"
                          onClick={() => handleApplyHistory(hist)}
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Candidate Results Grid */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                    Matching Profiles ({results.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sorted by Match Score rating
                  </Typography>
                </Stack>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : results.length === 0 ? (
                  <Alert severity="warning">No candidates matched the specified criteria. Try broadening search queries or slider ranges.</Alert>
                ) : (
                  <Stack spacing={2.5}>
                    {results.map((c) => {
                      const isAlreadySaved = savedLists.some(s => s.candidateId === c.candidateId);
                      return (
                        <Card key={c.candidateId} sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', borderRadius: 2 }}>
                          <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={2}>
                              
                              <Grid item xs={12} sm={9}>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                  <Avatar sx={{ bgcolor: '#0a66c2', color: 'white', width: 48, height: 48, fontSize: '1.25rem', fontWeight: 800 }}>
                                    {c.name.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 850, lineHeight: 1.1 }}>
                                        {c.name}
                                      </Typography>
                                      <Chip
                                        label={`${c.matchScore}% Match`}
                                        color="success"
                                        size="small"
                                        sx={{ fontWeight: 850, fontSize: '0.65rem', height: 18 }}
                                      />
                                    </Stack>

                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#0a66c2' }}>
                                      {c.headline}
                                    </Typography>

                                    {/* Brief summary */}
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem', lineHeight: 1.5 }}>
                                      {c.summary}
                                    </Typography>

                                    {/* Facets meta labels */}
                                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <LocationOnIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">{c.location}</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <WorkIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">{c.experienceYrs} yrs exp</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AttachMoneyIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">AED {c.salaryExpect.toLocaleString()}/mo</Typography>
                                      </Box>
                                      {c.education && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <SchoolIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                                          <Typography variant="caption" color="text.secondary">{c.education}</Typography>
                                        </Box>
                                      )}
                                    </Stack>

                                    {/* Skills chips */}
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                      {c.skills.map((skill, idx) => (
                                        <Chip
                                          key={idx}
                                          label={skill}
                                          size="small"
                                          variant="outlined"
                                          sx={{ fontSize: '0.65rem', height: 18 }}
                                        />
                                      ))}
                                    </Stack>
                                  </Box>
                                </Stack>
                              </Grid>

                              <Grid item xs={12} sm={3}>
                                <Stack spacing={1} justifyContent="flex-start" sx={{ height: '100%' }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={isAlreadySaved ? <StarIcon sx={{ color: '#f59e0b' }} /> : <StarBorderIcon />}
                                    onClick={() => handleOpenSaveDialog(c)}
                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                                  >
                                    {isAlreadySaved ? 'Bookmarked' : 'Bookmark'}
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<NoteAddIcon />}
                                    onClick={() => handleOpenNoteDialog(c)}
                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                                  >
                                    Notes
                                  </Button>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<MailOutlineIcon />}
                                    onClick={() => handleOpenContactDialog(c)}
                                    sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.75rem', bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
                                  >
                                    Contact
                                  </Button>
                                </Stack>
                              </Grid>

                            </Grid>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>

            </Stack>
          </Grid>

        </Grid>
      </Container>

      {/* Save to list Dialog */}
      <Dialog open={openSave} onClose={() => setOpenSave(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Bookmark Talent</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedCand && (
            <Stack spacing={2.5}>
              <Typography variant="body2" color="text.secondary">
                Bookmark <strong>{selectedCand.name}</strong> to custom pipeline folder list:
              </Typography>
              <TextField
                label="Folder List Name"
                fullWidth
                size="small"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSave(false)} color="inherit" size="small" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveBookmark}
            disabled={savingBookmark}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            {savingBookmark ? 'Saving...' : 'Confirm Bookmark'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recruiter Notes Dialog */}
      <Dialog open={openNote} onClose={() => setOpenNote(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Recruiter Notes Console</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedCand && (
            <Stack spacing={3}>
              <Typography variant="body2">
                Recruiter logging notes for: <strong>{selectedCand.name}</strong>
              </Typography>

              {/* History of notes */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                  Previous Notes History
                </Typography>
                {candNotesList.length === 0 ? (
                  <Alert severity="info">No notes logged for this candidate profile yet.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {candNotesList.map((n) => (
                      <Paper key={n.id} sx={{ p: 1.5, bgcolor: mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>{n.notes}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{n.createdAt}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider />

              {/* Add note field */}
              <TextField
                label="Log new recruitment note"
                multiline
                rows={3}
                placeholder="e.g. screening comments, technical ratings, next steps"
                fullWidth
                size="small"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNote(false)} color="inherit" size="small" sx={{ textTransform: 'none' }}>
            Close
          </Button>
          <Button
            onClick={handleAddNoteSubmit}
            disabled={savingNote || !noteText.trim()}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            {savingNote ? 'Saving...' : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact outreach Dialog */}
      <Dialog open={openContact} onClose={() => setOpenContact(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Talent Outreach Mailer</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedCand && (
            <Stack spacing={2.5}>
              <Typography variant="body2">
                Drafting communication invitation to: <strong>{selectedCand.name}</strong> ({selectedCand.email})
              </Typography>
              <TextField
                label="Subject line"
                fullWidth
                size="small"
                value={mailSubject}
                onChange={(e) => setMailSubject(e.target.value)}
              />
              <TextField
                label="Message details"
                multiline
                rows={6}
                fullWidth
                size="small"
                value={mailBody}
                onChange={(e) => setMailBody(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContact(false)} color="inherit" size="small" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleContactSubmit}
            disabled={sendingMail}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            {sendingMail ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
