'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Button,
  IconButton,
  LinearProgress,
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LanguageIcon from '@mui/icons-material/Language';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';

import { useColorMode } from '../providers';
import { profileApi } from '../../features/profile/services/profileApi';

interface Skill {
  id: string;
  name: string;
  proficiencyLevel: string;
}

interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  startDate?: string;
  endDate?: string;
}

interface Language {
  id: string;
  name: string;
  proficiency: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  dateAchieved?: string;
}

interface Profile {
  id: string;
  userId: string;
  headline: string;
  summary: string;
  availabilityStatus: string;
  profileCompletedPercentage: number;
  volunteering: string;
  publications: string;
  licenses: string;
  skills?: Skill[];
  certifications?: Certification[];
  projects?: Project[];
  languages?: Language[];
  achievements?: Achievement[];
}

export default function ProfilePage() {
  const { mode, toggleColorMode } = useColorMode();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visibility, setVisibility] = useState<string>('public');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editHeaderOpen, setEditHeaderOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [achOpen, setAchOpen] = useState(false);

  // Form states
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [availability, setAvailability] = useState('looking_for_networking');
  const [volunteering, setVolunteering] = useState('');
  const [publications, setPublications] = useState('');
  const [licensesText, setLicensesText] = useState('');

  const [skillName, setSkillName] = useState('');
  const [skillProf, setSkillProf] = useState('Intermediate');

  const [certName, setCertName] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certIssue, setCertIssue] = useState('');
  const [certExp, setCertExp] = useState('');
  const [certCredId, setCertCredId] = useState('');
  const [certCredUrl, setCertCredUrl] = useState('');

  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projUrl, setProjUrl] = useState('');
  const [projStart, setProjStart] = useState('');
  const [projEnd, setProjEnd] = useState('');

  const [langName, setLangName] = useState('');
  const [langProf, setLangProf] = useState('Professional working proficiency');

  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achDate, setAchDate] = useState('');

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getMyProfile();
      setProfile(data);
      setHeadline(data.headline || '');
      setSummary(data.summary || '');
      setAvailability(data.availabilityStatus || 'looking_for_networking');
      setVolunteering(data.volunteering || '');
      setPublications(data.publications || '');
      setLicensesText(data.licenses || '');

      const pref = await profileApi.getPreferences();
      setVisibility(pref.profileVisibility || 'public');
    } catch (err) {
      console.warn('Backend not running or schema unapplied, using client-side mock sandbox data.');
      // Load fallback mock data
      const mockProfile: Profile = {
        id: 'mock-prof-uuid',
        userId: profileApi.getMockUserId(),
        headline: 'Lead Developer at Kirmya',
        summary: 'Passionate software architect focused on scalable architectures, modular monolith designs, and developer experience. Highly skilled in Go, Next.js, and cloud orchestration.',
        availabilityStatus: 'open_to_work',
        profileCompletedPercentage: 80,
        volunteering: 'Open-source contributor to Go web packages.',
        publications: 'Modern Monolith Patterns - Kirmya Architecture Journal 2026',
        licenses: 'U.A.E. Engineering Council - Software Specialist License #991',
        skills: [
          { id: '1', name: 'Go (Golang)', proficiencyLevel: 'Expert' },
          { id: '2', name: 'Next.js & React', proficiencyLevel: 'Expert' },
          { id: '3', name: 'MUI v6 Design', proficiencyLevel: 'Intermediate' },
          { id: '4', name: 'PostgreSQL & pgvector', proficiencyLevel: 'Expert' },
        ],
        certifications: [
          { id: '1', name: 'AWS Solutions Architect Associate', issuingOrganization: 'Amazon Web Services', issueDate: '2025-01-10', expirationDate: '2028-01-10', credentialId: 'AWS-12345' },
        ],
        projects: [
          { id: '1', title: 'Kirmya Enterprise Monolith', description: 'Engineered the modular monorepo system handling jobs, messaging, and search indexing.', url: 'https://kirmya.ae' },
        ],
        languages: [
          { id: '1', name: 'English', proficiency: 'Bilingual proficiency' },
          { id: '2', name: 'Arabic', proficiency: 'Native proficiency' },
        ],
        achievements: [
          { id: '1', title: 'Antigravity Hackathon Winner', description: 'Awarded first place for creating the automated system architect code helper.' },
        ],
      };
      setProfile(mockProfile);
      setHeadline(mockProfile.headline);
      setSummary(mockProfile.summary);
      setAvailability(mockProfile.availabilityStatus);
      setVolunteering(mockProfile.volunteering);
      setPublications(mockProfile.publications);
      setLicensesText(mockProfile.licenses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateHeader = async () => {
    try {
      const updated = await profileApi.updateProfile({
        headline,
        summary,
        availabilityStatus: availability,
        volunteering,
        publications,
        licenses: licensesText,
      });
      setProfile(updated);
      setEditHeaderOpen(false);
    } catch (err) {
      // Mock update fallback
      if (profile) {
        const updated = {
          ...profile,
          headline,
          summary,
          availabilityStatus: availability,
          volunteering,
          publications,
          licenses: licensesText,
        };
        setProfile(updated);
      }
      setEditHeaderOpen(false);
    }
  };

  const handleAddSkill = async () => {
    if (!skillName) return;
    try {
      const skills = await profileApi.addSkill(skillName, skillProf);
      if (profile) setProfile({ ...profile, skills });
    } catch (err) {
      if (profile) {
        const newSkill = { id: Math.random().toString(), name: skillName, proficiencyLevel: skillProf };
        setProfile({ ...profile, skills: [...(profile.skills || []), newSkill] });
      }
    }
    setSkillName('');
    setSkillOpen(false);
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await profileApi.deleteSkill(id);
      fetchProfileData();
    } catch (err) {
      if (profile) {
        setProfile({ ...profile, skills: (profile.skills || []).filter(s => s.id !== id) });
      }
    }
  };

  const handleAddCert = async () => {
    if (!certName || !certOrg) return;
    try {
      const certs = await profileApi.addCertification({
        name: certName,
        issuingOrganization: certOrg,
        issueDate: certIssue || undefined,
        expirationDate: certExp || undefined,
        credentialId: certCredId || undefined,
        credentialUrl: certCredUrl || undefined,
      });
      if (profile) setProfile({ ...profile, certifications: certs });
    } catch (err) {
      if (profile) {
        const newCert = { id: Math.random().toString(), name: certName, issuingOrganization: certOrg, issueDate: certIssue, expirationDate: certExp, credentialId: certCredId, credentialUrl: certCredUrl };
        setProfile({ ...profile, certifications: [...(profile.certifications || []), newCert] });
      }
    }
    setCertName('');
    setCertOrg('');
    setCertIssue('');
    setCertExp('');
    setCertCredId('');
    setCertCredUrl('');
    setCertOpen(false);
  };

  const handleDeleteCert = async (id: string) => {
    try {
      await profileApi.deleteCertification(id);
      fetchProfileData();
    } catch (err) {
      if (profile) {
        setProfile({ ...profile, certifications: (profile.certifications || []).filter(c => c.id !== id) });
      }
    }
  };

  const handleAddProject = async () => {
    if (!projTitle) return;
    try {
      const projects = await profileApi.addProject({
        title: projTitle,
        description: projDesc || undefined,
        url: projUrl || undefined,
        startDate: projStart || undefined,
        endDate: projEnd || undefined,
      });
      if (profile) setProfile({ ...profile, projects });
    } catch (err) {
      if (profile) {
        const newProj = { id: Math.random().toString(), title: projTitle, description: projDesc, url: projUrl, startDate: projStart, endDate: projEnd };
        setProfile({ ...profile, projects: [...(profile.projects || []), newProj] });
      }
    }
    setProjTitle('');
    setProjDesc('');
    setProjUrl('');
    setProjStart('');
    setProjEnd('');
    setProjectOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await profileApi.deleteProject(id);
      fetchProfileData();
    } catch (err) {
      if (profile) {
        setProfile({ ...profile, projects: (profile.projects || []).filter(p => p.id !== id) });
      }
    }
  };

  const handleAddLanguage = async () => {
    if (!langName) return;
    try {
      const languages = await profileApi.addLanguage(langName, langProf);
      if (profile) setProfile({ ...profile, languages });
    } catch (err) {
      if (profile) {
        const newLang = { id: Math.random().toString(), name: langName, proficiency: langProf };
        setProfile({ ...profile, languages: [...(profile.languages || []), newLang] });
      }
    }
    setLangName('');
    setLangOpen(false);
  };

  const handleDeleteLanguage = async (id: string) => {
    try {
      await profileApi.deleteLanguage(id);
      fetchProfileData();
    } catch (err) {
      if (profile) {
        setProfile({ ...profile, languages: (profile.languages || []).filter(l => l.id !== id) });
      }
    }
  };

  const handleAddAchievement = async () => {
    if (!achTitle) return;
    try {
      const achievements = await profileApi.addAchievement({
        title: achTitle,
        description: achDesc || undefined,
        dateAchieved: achDate || undefined,
      });
      if (profile) setProfile({ ...profile, achievements });
    } catch (err) {
      if (profile) {
        const newAch = { id: Math.random().toString(), title: achTitle, description: achDesc, dateAchieved: achDate };
        setProfile({ ...profile, achievements: [...(profile.achievements || []), newAch] });
      }
    }
    setAchTitle('');
    setAchDesc('');
    setAchDate('');
    setAchOpen(false);
  };

  const handleDeleteAchievement = async (id: string) => {
    try {
      await profileApi.deleteAchievement(id);
      fetchProfileData();
    } catch (err) {
      if (profile) {
        setProfile({ ...profile, achievements: (profile.achievements || []).filter(a => a.id !== id) });
      }
    }
  };

  const handleUpdatePreferences = async (newVal: string) => {
    try {
      await profileApi.updatePreferences(newVal);
      setVisibility(newVal);
    } catch (err) {
      setVisibility(newVal);
    }
  };

  const getAvailabilityLabel = (status: string) => {
    switch (status) {
      case 'open_to_work': return '🟢 Open to Work';
      case 'available_for_freelance': return '⚡ Available for Freelance';
      case 'looking_for_networking': return '🤝 Open to Networking';
      case 'hiring': return '💼 Hiring / Recruiting';
      default: return 'Open to Opportunities';
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'open_to_work': return 'success';
      case 'available_for_freelance': return 'secondary';
      case 'hiring': return 'primary';
      default: return 'info';
    }
  };

  if (loading || !profile) {
    return (
      <Box sx={{ width: '100%', mt: 10, px: 3 }}>
        <LinearProgress color="primary" />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading Kirmya Profile Workspace...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, background: mode === 'light' ? 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)' : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
      
      {/* Top Bar Navigation */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Card sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #818cf8, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KIRMYA PROFESSIONAL WORKSPACE
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Visibility controls */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="visibility-label"><VisibilityIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} /> Visibility</InputLabel>
              <Select
                labelId="visibility-label"
                value={visibility}
                label="Visibility"
                onChange={(e) => handleUpdatePreferences(e.target.value)}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="connections_only">Connections Only</MenuItem>
                <MenuItem value="private">Private Profile</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Stack>
        </Card>
      </Container>

      {/* Main Profile Grid */}
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          
          {/* Left Column: Headers, Summaries, Projects, Experiences */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              
              {/* Profile Header Block */}
              <Card sx={{ position: 'relative', overflow: 'visible' }}>
                <Box sx={{ height: '180px', borderRadius: '16px 16px 0 0', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', position: 'relative' }} />
                <CardContent sx={{ pt: 0, position: 'relative' }}>
                  <Avatar
                    sx={{ width: 130, height: 130, border: '4px solid white', position: 'absolute', top: '-65px', left: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                    src="/assets/default-avatar.png"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <IconButton size="small" onClick={() => setEditHeaderOpen(true)} color="primary" sx={{ border: '1px solid', borderColor: 'primary.light' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ mt: 2, pl: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      Kirmya Member
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                      {profile.headline || 'Professional at Kirmya'}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={getAvailabilityLabel(profile.availabilityStatus)}
                        color={getAvailabilityColor(profile.availabilityStatus) as any}
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                      {profile.licenses && (
                        <Chip icon={<WorkspacePremiumIcon />} label="Licensed Specialist" color="secondary" variant="outlined" />
                      )}
                    </Stack>

                    {/* Completion Level Meter */}
                    <Box sx={{ mt: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Profile Strength Indicator</Typography>
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>{profile.profileCompletedPercentage}% Complete</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={profile.profileCompletedPercentage} sx={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.05)' }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Career Summary Card */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <InfoIcon color="primary" /> About & Summary
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {profile.summary || 'Write a career summary describing your expertise, achievements, and professional interests.'}
                  </Typography>
                </CardContent>
              </Card>

              {/* Projects Portfolio */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessCenterIcon color="primary" /> Projects Portfolio
                    </Typography>
                    <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => setProjectOpen(true)}>
                      Add Project
                    </Button>
                  </Box>

                  {profile.projects && profile.projects.length > 0 ? (
                    <Stack spacing={2} divider={<Divider />}>
                      {profile.projects.map((proj) => (
                        <Box key={proj.id} sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{proj.title}</Typography>
                            <IconButton size="small" onClick={() => handleDeleteProject(proj.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{proj.description}</Typography>
                          {proj.url && (
                            <Button href={proj.url} target="_blank" size="small" sx={{ mt: 1, textTransform: 'none' }}>
                              Visit Project Link
                            </Button>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No projects added yet.</Typography>
                  )}
                </CardContent>
              </Card>

            </Stack>
          </Grid>

          {/* Right Column: Skills, Certificates, Languages */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              
              {/* Skills section */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Skills</Typography>
                    <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => setSkillOpen(true)}>
                      Add
                    </Button>
                  </Box>

                  {profile.skills && profile.skills.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.skills.map((s) => (
                        <Chip
                          key={s.id}
                          label={`${s.name} (${s.proficiencyLevel})`}
                          onDelete={() => handleDeleteSkill(s.id)}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No skills listed yet.</Typography>
                  )}
                </CardContent>
              </Card>

              {/* Certifications and Badges */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Certifications</Typography>
                    <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => setCertOpen(true)}>
                      Add
                    </Button>
                  </Box>

                  {profile.certifications && profile.certifications.length > 0 ? (
                    <Stack spacing={2}>
                      {profile.certifications.map((c) => (
                        <Box key={c.id} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{c.name}</Typography>
                            <IconButton size="small" onClick={() => handleDeleteCert(c.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block">{c.issuingOrganization}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No certifications registered.</Typography>
                  )}
                </CardContent>
              </Card>

              {/* Languages */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LanguageIcon /> Languages
                    </Typography>
                    <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => setLangOpen(true)}>
                      Add
                    </Button>
                  </Box>

                  {profile.languages && profile.languages.length > 0 ? (
                    <Stack spacing={1}>
                      {profile.languages.map((l) => (
                        <Box key={l.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{l.name}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={l.proficiency} size="small" variant="outlined" />
                            <IconButton size="small" onClick={() => handleDeleteLanguage(l.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No languages listed.</Typography>
                  )}
                </CardContent>
              </Card>

              {/* Achievements & volunteering summaries */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Achievements</Typography>
                    <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => setAchOpen(true)}>
                      Add
                    </Button>
                  </Box>

                  {profile.achievements && profile.achievements.length > 0 ? (
                    <Stack spacing={1.5}>
                      {profile.achievements.map((a) => (
                        <Box key={a.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{a.title}</Typography>
                            <IconButton size="small" onClick={() => handleDeleteAchievement(a.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="body2" color="text.secondary">{a.description}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No achievements logged.</Typography>
                  )}
                </CardContent>
              </Card>

            </Stack>
          </Grid>

        </Grid>
      </Container>

      {/* ----------------- DIALOG MODALS ----------------- */}

      {/* Edit Header Modal */}
      <Dialog open={editHeaderOpen} onClose={() => setEditHeaderOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Headline" fullWidth value={headline} onChange={(e) => setHeadline(e.target.value)} />
            <TextField label="Professional Career Summary" multiline rows={4} fullWidth value={summary} onChange={(e) => setSummary(e.target.value)} />
            
            <FormControl fullWidth>
              <InputLabel>Availability Status</InputLabel>
              <Select value={availability} label="Availability Status" onChange={(e) => setAvailability(e.target.value)}>
                <MenuItem value="open_to_work">Open to Work</MenuItem>
                <MenuItem value="available_for_freelance">Available for Freelance</MenuItem>
                <MenuItem value="looking_for_networking">Looking for Networking</MenuItem>
                <MenuItem value="hiring">Hiring / Recruiting</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Volunteering Experience" fullWidth value={volunteering} onChange={(e) => setVolunteering(e.target.value)} />
            <TextField label="Publications" fullWidth value={publications} onChange={(e) => setPublications(e.target.value)} />
            <TextField label="Licenses & Patents" fullWidth value={licensesText} onChange={(e) => setLicensesText(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditHeaderOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateHeader} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Add Skill Modal */}
      <Dialog open={skillOpen} onClose={() => setSkillOpen(false)}>
        <DialogTitle>Add Skill</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Skill Name" fullWidth value={skillName} onChange={(e) => setSkillName(e.target.value)} />
            <FormControl fullWidth>
              <InputLabel>Proficiency Level</InputLabel>
              <Select value={skillProf} label="Proficiency Level" onChange={(e) => setSkillProf(e.target.value)}>
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Expert">Expert</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSkill} variant="contained">Add Skill</Button>
        </DialogActions>
      </Dialog>

      {/* Add Certification Modal */}
      <Dialog open={certOpen} onClose={() => setCertOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Certification</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Certification Name" fullWidth value={certName} onChange={(e) => setCertName(e.target.value)} />
            <TextField label="Issuing Organization" fullWidth value={certOrg} onChange={(e) => setCertOrg(e.target.value)} />
            <TextField label="Issue Date (YYYY-MM-DD)" fullWidth placeholder="2026-01-01" value={certIssue} onChange={(e) => setCertIssue(e.target.value)} />
            <TextField label="Expiration Date (YYYY-MM-DD)" fullWidth placeholder="2029-01-01" value={certExp} onChange={(e) => setCertExp(e.target.value)} />
            <TextField label="Credential ID" fullWidth value={certCredId} onChange={(e) => setCertCredId(e.target.value)} />
            <TextField label="Credential URL" fullWidth value={certCredUrl} onChange={(e) => setCertCredUrl(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCert} variant="contained">Add Certification</Button>
        </DialogActions>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={projectOpen} onClose={() => setProjectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Project</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Project Title" fullWidth value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
            <TextField label="Description" multiline rows={3} fullWidth value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
            <TextField label="Project Link URL" fullWidth value={projUrl} onChange={(e) => setProjUrl(e.target.value)} />
            <TextField label="Start Date (YYYY-MM-DD)" fullWidth placeholder="2026-01-01" value={projStart} onChange={(e) => setProjStart(e.target.value)} />
            <TextField label="End Date (YYYY-MM-DD)" fullWidth placeholder="2026-06-30" value={projEnd} onChange={(e) => setProjEnd(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectOpen(false)}>Cancel</Button>
          <Button onClick={handleAddProject} variant="contained">Add Project</Button>
        </DialogActions>
      </Dialog>

      {/* Add Language Modal */}
      <Dialog open={langOpen} onClose={() => setLangOpen(false)}>
        <DialogTitle>Add Language</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Language Name" fullWidth value={langName} onChange={(e) => setLangName(e.target.value)} />
            <TextField label="Proficiency Level" fullWidth placeholder="Bilingual proficiency" value={langProf} onChange={(e) => setLangProf(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLangOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLanguage} variant="contained">Add Language</Button>
        </DialogActions>
      </Dialog>

      {/* Add Achievement Modal */}
      <Dialog open={achOpen} onClose={() => setAchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Achievement</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Achievement Title" fullWidth value={achTitle} onChange={(e) => setAchTitle(e.target.value)} />
            <TextField label="Description" multiline rows={3} fullWidth value={achDesc} onChange={(e) => setAchDesc(e.target.value)} />
            <TextField label="Date Achieved (YYYY-MM-DD)" fullWidth placeholder="2026-05-15" value={achDate} onChange={(e) => setAchDate(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAchOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAchievement} variant="contained">Add Achievement</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
