'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import Link from 'next/link';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import LaunchIcon from '@mui/icons-material/Launch';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import VerifiedIcon from '@mui/icons-material/Verified';

import { useColorMode } from '../providers';
import { companyApi } from '../../features/company/services/companyApi';

interface CompanyListItem {
  company: {
    id: string;
    name: string;
    handle: string;
  };
  profile: {
    logoUrl: string;
    about: string;
    industry: string;
    location: string;
    companySize: string;
    followersCount: number;
  };
}

export default function CompaniesSearchPage() {
  const { mode, toggleColorMode } = useColorMode();
  
  // States
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [recommendations, setRecommendations] = useState<CompanyListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set());

  // Dialog State for Registration
  const [openRegister, setOpenRegister] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newIndustry, setNewIndustry] = useState('Technology');
  const [newSize, setNewSize] = useState('10-50 employees');
  const [newLocation, setNewLocation] = useState('Dubai, UAE');
  const [newWebsite, setNewWebsite] = useState('');
  const [newFounded, setNewFounded] = useState('2020');
  const [registering, setRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Set Title
  useEffect(() => {
    document.title = "Kirmya - Company Discovery Hub";
  }, []);

  const loadData = async (queryVal: string = '') => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Load search results
      const searchRes = await companyApi.searchCompanies(queryVal);
      setCompanies(searchRes || []);

      // Load recommendations
      const recRes = await companyApi.getRecommendations(3);
      setRecommendations(recRes || []);
    } catch (err) {
      console.warn('Backend server unreachable. Engaging company discovery sandbox simulator.');
      setIsSandboxMode(true);

      // Pre-load simulator list
      const stubs: CompanyListItem[] = [
        {
          company: { id: '1-google', name: 'Google UAE', handle: 'google-uae' },
          profile: { logoUrl: '', about: 'Organize the world\'s information and make it universally accessible and useful.', industry: 'Technology', location: 'Dubai, UAE', companySize: '10,000+ employees', followersCount: 4320 },
        },
        {
          company: { id: '2-ms', name: 'Microsoft Dubai', handle: 'microsoft-dubai' },
          profile: { logoUrl: '', about: 'Empower every person and every organization on the planet to achieve more.', industry: 'Technology', location: 'Dubai, UAE', companySize: '10,000+ employees', followersCount: 3890 },
        },
        {
          company: { id: '3-ek', name: 'Emirates Group', handle: 'emirates' },
          profile: { logoUrl: '', about: 'Fly Emirates, Fly Better. A global aviation conglomerate based in Dubai.', industry: 'Aviation', location: 'Dubai Airport, UAE', companySize: '5,000-10,000 employees', followersCount: 6840 },
        },
        {
          company: { id: '4-adnoc', name: 'ADNOC Group', handle: 'adnoc' },
          profile: { logoUrl: '', about: 'One of the world\'s leading energy producers and primary catalyst for Abu Dhabi.', industry: 'Energy', location: 'Abu Dhabi, UAE', companySize: '10,000+ employees', followersCount: 5120 },
        },
      ];

      // Filter local stubs on query match
      const filtered = stubs.filter(s => 
        queryVal === '' || 
        s.company.name.toLowerCase().includes(queryVal.toLowerCase()) ||
        s.profile.industry.toLowerCase().includes(queryVal.toLowerCase()) ||
        s.profile.location.toLowerCase().includes(queryVal.toLowerCase())
      );

      setCompanies(filtered);
      setRecommendations(stubs.slice(0, 3));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(searchQuery);
  }, [searchQuery]);

  const handleFollowToggle = async (companyID: string) => {
    // Optimistic state toggle
    setFollowedSet(prev => {
      const next = new Set(prev);
      if (next.has(companyID)) {
        next.delete(companyID);
      } else {
        next.add(companyID);
      }
      return next;
    });

    // Update counts locally
    const adjustCount = (list: CompanyListItem[]) => 
      list.map(item => {
        if (item.company.id === companyID) {
          const isFollowingNow = !followedSet.has(companyID);
          return {
            ...item,
            profile: {
              ...item.profile,
              followersCount: item.profile.followersCount + (isFollowingNow ? 1 : -1)
            }
          };
        }
        return item;
      });

    setCompanies(prev => adjustCount(prev));
    setRecommendations(prev => adjustCount(prev));

    try {
      if (!isSandboxMode) {
        await companyApi.followCompany(companyID);
      }
    } catch (err) {
      // Ignore API issues in simulator
    }
  };

  const handleRegisterSubmit = async () => {
    if (!newName.trim() || !newHandle.trim()) {
      setErrorMsg('Name and handle slug are required');
      return;
    }

    setRegistering(true);
    setErrorMsg('');

    try {
      const payload = {
        name: newName,
        handle: newHandle.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        industry: newIndustry,
        location: newLocation,
        website: newWebsite || `https://www.${newHandle}.com`,
        companySize: newSize,
        foundedYear: parseInt(newFounded) || 2020,
      };

      if (isSandboxMode) {
        // Mock register addition
        const newObj: CompanyListItem = {
          company: { id: `mock-${Date.now()}`, name: payload.name, handle: payload.handle },
          profile: { logoUrl: '', about: 'Created in sandbox mode.', industry: payload.industry, location: payload.location, companySize: payload.companySize, followersCount: 1 },
        };
        setCompanies(prev => [newObj, ...prev]);
        setOpenRegister(false);
      } else {
        await companyApi.registerCompany(payload);
        setOpenRegister(false);
        loadData(searchQuery);
      }

      // Reset fields
      setNewName('');
      setNewHandle('');
      setNewWebsite('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Registration failed');
    } finally {
      setRegistering(false);
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
      {/* Search Header */}
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
          <Avatar sx={{ bgcolor: '#0a66c2', width: 36, height: 36 }}>
            <WorkOutlineIcon />
          </Avatar>
          <Box>
            <Typography component="h1" variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'light' ? '#1f2937' : '#f9fafb', lineHeight: 1.1 }}>
              Kirmya Company Hub
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Discover & Follow Leading Organizations
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenRegister(true)}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            Register Company
          </Button>
          <IconButton onClick={toggleColorMode} sx={{ color: 'text.secondary' }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Main Container */}
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Grid container spacing={3.5}>
          
          {/* Left Column: Search & Dynamic results list */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <TextField
                    placeholder="Search companies by name, industry, or location..."
                    fullWidth
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                  />
                </CardContent>
              </Card>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : companies.length === 0 ? (
                <Alert severity="info">No companies matched your search query. Try registering one!</Alert>
              ) : (
                <Grid container spacing={2.5}>
                  {companies.map((c) => {
                    const following = followedSet.has(c.company.id);
                    return (
                      <Grid item xs={12} sm={6} key={c.company.id}>
                        <Card sx={{ height: '100%', bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', position: 'relative' }}>
                          <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                              <Avatar sx={{ bgcolor: '#0a66c2', width: 48, height: 48, borderRadius: 1.5, fontSize: '1.2rem', fontWeight: 800 }}>
                                {c.company.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Link href={`/companies/${c.company.handle}`} style={{ textDecoration: 'none' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a66c2', '&:hover': { textDecoration: 'underline' }, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      {c.company.name} <LaunchIcon sx={{ fontSize: '0.8rem' }} />
                                    </Typography>
                                  </Link>
                                  <VerifiedIcon sx={{ color: '#0a66c2', fontSize: '0.9rem' }} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {c.profile.industry} • {c.profile.location}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  {c.profile.followersCount} followers
                                </Typography>
                              </Box>
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {c.profile.about}
                            </Typography>

                            <Button
                              variant={following ? "outlined" : "contained"}
                              fullWidth
                              size="small"
                              onClick={() => handleFollowToggle(c.company.id)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderColor: '#0a66c2',
                                color: following ? '#0a66c2' : 'white',
                                bgcolor: following ? 'transparent' : '#0a66c2',
                                '&:hover': {
                                  bgcolor: following ? 'rgba(10,102,194,0.05)' : '#004182',
                                },
                              }}
                            >
                              {following ? "Following" : "Follow"}
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Stack>
          </Grid>

          {/* Right Column: Recommendations Panel */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 2 }}>
                  Recommended Companies
                </Typography>
                <Stack spacing={2.5}>
                  {recommendations.slice(0, 3).map((r) => {
                    const following = followedSet.has(r.company.id);
                    return (
                      <Box key={r.company.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Avatar sx={{ bgcolor: '#004182', width: 36, height: 36, borderRadius: 1 }}>
                          {r.company.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Link href={`/companies/${r.company.handle}`} style={{ textDecoration: 'none' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'light' ? '#1f2937' : '#f9fafb', '&:hover': { color: '#0a66c2' } }}>
                              {r.company.name}
                            </Typography>
                          </Link>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                            {r.profile.industry} • {r.profile.location}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => handleFollowToggle(r.company.id)}
                            sx={{ p: 0, textTransform: 'none', fontSize: '0.7rem', fontWeight: 800, minWidth: 0, color: '#0a66c2', mt: 0.25 }}
                          >
                            {following ? "Following" : "+ Follow"}
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>

      {/* Registration Dialog */}
      <Dialog open={openRegister} onClose={() => setOpenRegister(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Register Company Page</DialogTitle>
        <DialogContent dividers>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>
          )}
          <Stack spacing={2.5} sx={{ py: 1 }}>
            <TextField
              label="Company Name"
              placeholder="e.g. Acme Corp"
              fullWidth
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <TextField
              label="URL Handle Slug"
              placeholder="e.g. acme-corp"
              fullWidth
              size="small"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            />
            <TextField
              label="Industry"
              placeholder="e.g. Financial Services"
              fullWidth
              size="small"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Company Size"
                  placeholder="e.g. 51-200 employees"
                  fullWidth
                  size="small"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Founded Year"
                  placeholder="e.g. 2015"
                  fullWidth
                  size="small"
                  value={newFounded}
                  onChange={(e) => setNewFounded(e.target.value)}
                />
              </Grid>
            </Grid>
            <TextField
              label="Headquarters Location"
              placeholder="e.g. Dubai, UAE"
              fullWidth
              size="small"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
            <TextField
              label="Company Website"
              placeholder="e.g. https://www.acme.com"
              fullWidth
              size="small"
              value={newWebsite}
              onChange={(e) => setNewWebsite(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRegister(false)} color="inherit" size="small" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleRegisterSubmit}
            disabled={registering}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            {registering ? 'Creating...' : 'Create Page'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
