'use client';

import React, { useEffect, useState, use } from 'react';
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
  Tabs,
  Tab,
  Divider,
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
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import VerifiedIcon from '@mui/icons-material/Verified';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

import { useColorMode } from '../../providers';
import { companyApi } from '../../../features/company/services/companyApi';

interface CompanyDetail {
  id: string;
  name: string;
  handle: string;
}

interface ProfileDetail {
  logoUrl: string;
  coverUrl: string;
  about: string;
  industry: string;
  companySize: string;
  location: string;
  website: string;
  foundedYear: number;
  culture: string;
  benefits: string[];
  employeeInsights: string;
  followersCount: number;
}

interface PageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default function CompanyDetailPage({ params }: PageProps) {
  const { handle } = use(params);
  const { mode, toggleColorMode } = useColorMode();

  // States
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [following, setFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // Flag to allow toggling edit forms in local tests

  // Editing state
  const [openEdit, setOpenEdit] = useState(false);
  const [editAbout, setEditAbout] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editCulture, setEditCulture] = useState('');
  const [editInsights, setEditInsights] = useState('');
  const [editBenefits, setEditBenefits] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Set Title
  useEffect(() => {
    if (company) {
      document.title = `${company.name} | Kirmya Company Page`;
    }
  }, [company]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await companyApi.getByHandle(handle);
      setCompany(data.company);
      setProfile(data.profile);
      setFollowing(data.following || false);
    } catch (err) {
      console.warn('Backend server unreachable. Loading company profile from local simulator data.');
      setIsSandboxMode(true);

      // Simulator default profiles matching handles
      const handleLower = handle.toLowerCase();
      let mockName = "Google UAE";
      let mockID = "1-google";
      let mockIndustry = "Technology";
      let mockWebsite = "https://www.google.ae";
      let mockLocation = "Dubai, UAE";
      let mockSize = "10,000+ employees";
      let mockFounded = 1998;
      let mockFollowers = 4320;

      if (handleLower === "microsoft-dubai") {
        mockName = "Microsoft Dubai";
        mockID = "2-ms";
        mockWebsite = "https://www.microsoft.com/en-ae";
        mockFounded = 1975;
        mockFollowers = 3890;
      } else if (handleLower === "emirates") {
        mockName = "Emirates Group";
        mockID = "3-ek";
        mockIndustry = "Aviation";
        mockWebsite = "https://www.emirates.com";
        mockLocation = "Dubai Airport, UAE";
        mockSize = "5,000-10,000 employees";
        mockFounded = 1985;
        mockFollowers = 6840;
      } else if (handleLower === "adnoc") {
        mockName = "ADNOC Group";
        mockID = "4-adnoc";
        mockIndustry = "Energy";
        mockWebsite = "https://www.adnoc.ae";
        mockLocation = "Abu Dhabi, UAE";
        mockSize = "10,000+ employees";
        mockFounded = 1971;
        mockFollowers = 5120;
      } else {
        // Fallback for custom registered pages in sandbox
        mockName = handle.charAt(0).toUpperCase() + handle.slice(1).replace(/-/g, ' ');
        mockID = `mock-${Date.now()}`;
      }

      setCompany({ id: mockID, name: mockName, handle });
      setProfile({
        logoUrl: '',
        coverUrl: '',
        about: `Welcome to the official Kirmya company page of ${mockName}. We are globally recognized for excellence in the ${mockIndustry} sector.`,
        industry: mockIndustry,
        companySize: mockSize,
        location: mockLocation,
        website: mockWebsite,
        foundedYear: mockFounded,
        culture: "We drive growth, prioritize work-life balance, and reward continuous learning.",
        benefits: ["Full Health Coverage", "Remote Work Options", "Education Reimbursement", "Travel Allowances"],
        employeeInsights: "96% of team members approve of management leadership.",
        followersCount: mockFollowers,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, [handle]);

  const handleFollowToggle = async () => {
    if (!profile || !company) return;

    const nextFollowing = !following;
    setFollowing(nextFollowing);
    
    // Update count locally
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        followersCount: prev.followersCount + (nextFollowing ? 1 : -1)
      };
    });

    try {
      if (!isSandboxMode) {
        await companyApi.followCompany(company.id);
      }
    } catch (err) {
      // Ignore API issues in sandbox
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = () => {
    if (!profile) return;
    setEditAbout(profile.about);
    setEditWebsite(profile.website);
    setEditLocation(profile.location);
    setEditSize(profile.companySize);
    setEditCulture(profile.culture);
    setEditInsights(profile.employeeInsights);
    setEditBenefits(profile.benefits.join(', '));
    setOpenEdit(true);
  };

  // Save Edits
  const handleSaveEdit = async () => {
    if (!company || !profile) return;
    setSaving(true);
    setErrorMsg('');

    const parsedBenefits = editBenefits.split(',').map(b => b.trim()).filter(b => b !== '');

    const updatedProfile: ProfileDetail = {
      ...profile,
      about: editAbout,
      website: editWebsite,
      location: editLocation,
      companySize: editSize,
      culture: editCulture,
      employeeInsights: editInsights,
      benefits: parsedBenefits,
    };

    try {
      if (isSandboxMode) {
        setProfile(updatedProfile);
        setOpenEdit(false);
      } else {
        await companyApi.updateProfile(company.id, updatedProfile);
        setProfile(updatedProfile);
        setOpenEdit(false);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: mode === 'light' ? '#f3f2f0' : '#090d16' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!company || !profile) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: mode === 'light' ? '#f3f2f0' : '#090d16' }}>
        <Alert severity="error">Company profile not found.</Alert>
      </Box>
    );
  }

  // Jobs mock stubs for the Jobs Tab
  const mockJobs = [
    { title: "Senior Software Engineer (Golang)", dept: "Engineering", loc: profile.location },
    { title: "Staff Site Reliability Architect", dept: "Infrastructure", loc: profile.location },
    { title: "Technical Project Director", dept: "Operations", loc: profile.location },
  ];

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
          <Link href="/companies" style={{ textDecoration: 'none' }}>
            <IconButton sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
          </Link>
          <Box>
            <Typography component="h1" variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'light' ? '#1f2937' : '#f9fafb', lineHeight: 1.1 }}>
              {company.name} Profile
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Company Page Console
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {isAdmin && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleOpenEdit}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#0a66c2', color: '#0a66c2' }}
            >
              Edit Page
            </Button>
          )}
          <IconButton onClick={toggleColorMode} sx={{ color: 'text.secondary' }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Main Console Layout */}
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
        <Stack spacing={3.5}>
          
          {/* Card: Logo and Cover Header Panel */}
          <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', overflow: 'visible', borderRadius: 2 }}>
            {/* Visual Cover Banner */}
            <Box
              sx={{
                height: '160px',
                background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
                position: 'relative',
              }}
            >
              {/* Overlapping Logo */}
              <Avatar
                sx={{
                  bgcolor: '#0a66c2',
                  color: 'white',
                  width: 90,
                  height: 90,
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  borderRadius: 2,
                  border: '4px solid',
                  borderColor: mode === 'light' ? 'white' : '#111827',
                  position: 'absolute',
                  left: '24px',
                  bottom: '-32px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
              >
                {company.name.charAt(0)}
              </Avatar>
            </Box>

            {/* Profile Brief Info */}
            <Box sx={{ pt: 5, px: 3, pb: 3 }}>
              <Grid container justifyContent="space-between" alignItems="flex-start">
                <Grid item>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {company.name}
                    </Typography>
                    <VerifiedIcon sx={{ color: '#0a66c2', fontSize: '1.4rem' }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {profile.industry} • {profile.location}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>{profile.followersCount}</strong> followers
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <strong>{profile.companySize}</strong> size
                    </Typography>
                  </Stack>
                </Grid>

                <Grid item>
                  <Button
                    variant={following ? "outlined" : "contained"}
                    onClick={handleFollowToggle}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      bgcolor: following ? 'transparent' : '#0a66c2',
                      color: following ? '#0a66c2' : 'white',
                      borderColor: '#0a66c2',
                      px: 3,
                      '&:hover': {
                        bgcolor: following ? 'rgba(10,102,194,0.05)' : '#004182',
                      },
                    }}
                  >
                    {following ? "Following" : "Follow"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Card>

          {/* Navigation Tabbed Area */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: mode === 'light' ? 'white' : '#111827', borderRadius: 2, p: 1 }}>
            <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} variant="fullWidth">
              <Tab label="About" sx={{ textTransform: 'none', fontWeight: 800 }} />
              <Tab label="Culture & Insights" sx={{ textTransform: 'none', fontWeight: 800 }} />
              <Tab label="Open Jobs" sx={{ textTransform: 'none', fontWeight: 800 }} />
            </Tabs>
          </Box>

          {/* Tab 0: About */}
          {activeTab === 0 && (
            <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
              <CardContent sx={{ p: 4.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 2 }}>
                  Overview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4.5, lineHeight: 1.6 }}>
                  {profile.about}
                </Typography>

                <Divider sx={{ mb: 4.5 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 2 }}>
                  Key Facts & Benefits
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4.5 }}>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LanguageIcon color="primary" fontSize="small" />
                        <a href={profile.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#0a66c2', textDecoration: 'none' }}>
                          {profile.website}
                        </a>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LocationOnIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">{profile.location}</Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PeopleIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">{profile.companySize}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CalendarTodayIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">Founded in {profile.foundedYear}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, mb: 2 }}>Featured Employee Benefits</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {profile.benefits.map((benefit, idx) => (
                      <Chip
                        key={idx}
                        icon={<CheckCircleIcon sx={{ fontSize: '0.95rem' }} />}
                        label={benefit}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ py: 1.5, px: 0.5 }}
                      />
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Tab 1: Culture & Insights */}
          {activeTab === 1 && (
            <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
              <CardContent sx={{ p: 4.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 2 }}>
                  Company Culture
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4.5, lineHeight: 1.6 }}>
                  {profile.culture}
                </Typography>

                <Divider sx={{ mb: 4.5 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 2 }}>
                  Employee Insights
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {profile.employeeInsights}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Tab 2: Open Jobs */}
          {activeTab === 2 && (
            <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
              <CardContent sx={{ p: 4.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 3 }}>
                  Active Openings at {company.name}
                </Typography>
                <List sx={{ p: 0 }}>
                  {mockJobs.map((job, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemIcon sx={{ minWidth: 36, color: '#0a66c2' }}>
                          <WorkOutlineIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{job.title}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{job.dept} • {job.loc}</Typography>}
                        />
                        <Button variant="outlined" size="small" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
                          Apply
                        </Button>
                      </ListItem>
                      {idx < mockJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

        </Stack>
      </Container>

      {/* Editing Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Company Profile</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>
          )}
          <Stack spacing={2.5}>
            <TextField
              label="Website URL"
              fullWidth
              size="small"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
            />
            <TextField
              label="Headquarters Location"
              fullWidth
              size="small"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
            <TextField
              label="Company Size Category"
              fullWidth
              size="small"
              value={editSize}
              onChange={(e) => setEditSize(e.target.value)}
            />
            <TextField
              label="About Overview"
              multiline
              rows={3}
              fullWidth
              size="small"
              value={editAbout}
              onChange={(e) => setEditAbout(e.target.value)}
            />
            <TextField
              label="Company Culture"
              multiline
              rows={2}
              fullWidth
              size="small"
              value={editCulture}
              onChange={(e) => setEditCulture(e.target.value)}
            />
            <TextField
              label="Employee Insights"
              multiline
              rows={2}
              fullWidth
              size="small"
              value={editInsights}
              onChange={(e) => setEditInsights(e.target.value)}
            />
            <TextField
              label="Featured Benefits (Comma-separated)"
              placeholder="e.g. Health Insurance, Remote Options, Flexible Hours"
              fullWidth
              size="small"
              value={editBenefits}
              onChange={(e) => setEditBenefits(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} color="inherit" size="small" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={saving}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
