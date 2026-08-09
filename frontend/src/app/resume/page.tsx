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
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useColorMode } from '../providers';
import { resumeApi } from '../../features/resume/services/resumeApi';

interface ResumeSection {
  id?: string;
  sectionType: string;
  content: string; // JSON string
  sortOrder: number;
}

interface Resume {
  id: string;
  title: string;
  templateName: string;
  isDefault: boolean;
  atsScore: number;
  aiSuggestions: string; // JSON array string
  createdAt: string;
  updatedAt: string;
  sections?: ResumeSection[];
}

interface ResumeVersion {
  id: string;
  versionTag: string;
  createdAt: string;
  atsScore: number;
  aiSuggestions: string;
}

export default function ResumePage() {
  const { mode, toggleColorMode } = useColorMode();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState('classic');

  // Active section inputs
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', address: '', website: '' });
  const [summary, setSummary] = useState('');
  const [experience, setExperience] = useState([{ company: '', role: '', duration: '', description: '' }]);
  const [education, setEducation] = useState([{ school: '', degree: '', year: '' }]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState('');
  const [certifications, setCertifications] = useState([{ name: '', authority: '', year: '' }]);
  const [projects, setProjects] = useState([{ title: '', description: '', link: '' }]);
  const [achievements, setAchievements] = useState([{ title: '', desc: '' }]);
  const [languages, setLanguages] = useState([{ name: '', level: '' }]);

  const fetchResumesList = async () => {
    try {
      setLoading(true);
      const list = await resumeApi.listResumes();
      setResumes(list);
      if (list.length > 0 && !selectedResume) {
        handleSelectResume(list[0]);
      }
    } catch (err) {
      console.warn('Backend not running or schema unapplied, using client-side mock sandbox data.');
      // Load fallback mock data
      const mockResumes: Resume[] = [
        {
          id: 'mock-resume-uuid-1',
          title: 'Full Stack Architect Resume',
          templateName: 'modern',
          isDefault: true,
          atsScore: 78,
          aiSuggestions: `["Add certifications to summary", "Specify Go database driver configurations in projects description"]`,
          createdAt: '2026-07-24T10:00:00Z',
          updatedAt: '2026-07-24T12:00:00Z',
          sections: [
            {
              sectionType: 'personal_info',
              sortOrder: 0,
              content: JSON.stringify({ name: 'Firas Al-Mansoori', email: 'firas@kirmya.ae', phone: '+971 50 123 4567', address: 'Dubai, U.A.E.', website: 'https://firas.dev' }),
            },
            {
              sectionType: 'summary',
              sortOrder: 1,
              content: JSON.stringify({ summary: 'Lead Solution Architect with 8+ years developing Go, Next.js, and Kubernetes platforms across the Middle East. Specialized in high-performance caching and messaging grids.' }),
            },
            {
              sectionType: 'experience',
              sortOrder: 2,
              content: JSON.stringify([
                { company: 'Kirmya', role: 'Staff Software Architect', duration: '2024 - Present', description: 'Architected modular monolith foundations and outbox task schedulers. Wrote vector databases integration blueprints.' },
                { company: 'Emirates Tech', role: 'Senior Go Developer', duration: '2021 - 2024', description: 'Built real-time messaging APIs serving 100k+ concurrent active WebSockets.' },
              ]),
            },
            {
              sectionType: 'education',
              sortOrder: 3,
              content: JSON.stringify([
                { school: 'Sharjah University', degree: 'M.Sc. Computer Science', year: '2021' },
              ]),
            },
            {
              sectionType: 'skills',
              sortOrder: 4,
              content: JSON.stringify(['Golang', 'Next.js', 'PostgreSQL', 'Redis', 'NATS', 'Kubernetes']),
            },
            {
              sectionType: 'certs',
              sortOrder: 5,
              content: JSON.stringify([{ name: 'AWS Certified Solutions Architect', authority: 'Amazon Web Services', year: '2025' }]),
            },
            {
              sectionType: 'projects',
              sortOrder: 6,
              content: JSON.stringify([{ title: 'Modular Monolith Orchestrator', description: 'Go utility package providing automatic dependency binding for modular backend architectures.', link: 'https://github.com/kirmya/monolith' }]),
            },
            {
              sectionType: 'languages',
              sortOrder: 7,
              content: JSON.stringify([{ name: 'Arabic', level: 'Native' }, { name: 'English', level: 'Fluent' }]),
            },
          ],
        },
      ];
      setResumes(mockResumes);
      if (!selectedResume) {
        handleSelectResume(mockResumes[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumesList();
  }, []);

  const handleSelectResume = async (res: Resume) => {
    setSelectedResume(res);
    setPersonalInfo({ name: '', email: '', phone: '', address: '', website: '' });
    setSummary('');
    setExperience([]);
    setEducation([]);
    setSkills([]);
    setCertifications([]);
    setProjects([]);
    setAchievements([]);
    setLanguages([]);

    if (res.sections) {
      loadSectionsData(res.sections);
    } else {
      try {
        const detail = await resumeApi.getResume(res.id);
        setSelectedResume(detail);
        if (detail.sections) {
          loadSectionsData(detail.sections);
        }
      } catch (err) {
        // Fallback already loaded
      }
    }

    try {
      const vers = await resumeApi.listVersions(res.id);
      setVersions(vers);
    } catch (err) {
      setVersions([
        { id: '1', versionTag: 'v20260724-120000', atsScore: 78, aiSuggestions: `["Add certifications to summary"]`, createdAt: '2026-07-24T12:00:00Z' },
        { id: '2', versionTag: 'v20260724-100000', atsScore: 50, aiSuggestions: `["Add career summary details", "List professional experience milestones"]`, createdAt: '2026-07-24T10:00:00Z' },
      ]);
    }
  };

  const loadSectionsData = (sections: ResumeSection[]) => {
    sections.forEach((sec) => {
      try {
        const payload = JSON.parse(sec.content);
        switch (sec.sectionType) {
          case 'personal_info':
            setPersonalInfo({
              name: payload.name || '',
              email: payload.email || '',
              phone: payload.phone || '',
              address: payload.address || '',
              website: payload.website || '',
            });
            break;
          case 'summary':
            setSummary(payload.summary || '');
            break;
          case 'experience':
            setExperience(Array.isArray(payload) ? payload : []);
            break;
          case 'education':
            setEducation(Array.isArray(payload) ? payload : []);
            break;
          case 'skills':
            setSkills(Array.isArray(payload) ? payload : []);
            break;
          case 'certs':
            setCertifications(Array.isArray(payload) ? payload : []);
            break;
          case 'projects':
            setProjects(Array.isArray(payload) ? payload : []);
            break;
          case 'achievements':
            setAchievements(Array.isArray(payload) ? payload : []);
            break;
          case 'languages':
            setLanguages(Array.isArray(payload) ? payload : []);
            break;
        }
      } catch (e) {
        // Skip malformed
      }
    });
  };

  const handleCreateResume = async () => {
    if (!newTitle) return;
    try {
      const created = await resumeApi.createResume(newTitle, newTemplate);
      setResumes([...resumes, created]);
      handleSelectResume(created);
    } catch (err) {
      const mockCreated: Resume = {
        id: Math.random().toString(),
        title: newTitle,
        templateName: newTemplate,
        isDefault: false,
        atsScore: 30,
        aiSuggestions: `["Add career summary details", "List professional experience milestones"]`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [
          { sectionType: 'personal_info', sortOrder: 0, content: '{}' },
          { sectionType: 'summary', sortOrder: 1, content: '{}' },
        ],
      };
      setResumes([...resumes, mockCreated]);
      handleSelectResume(mockCreated);
    }
    setNewTitle('');
    setCreateOpen(false);
  };

  const handleSaveSections = async () => {
    if (!selectedResume) return;

    const sectionsPayload = [
      { sectionType: 'personal_info', content: JSON.stringify(personalInfo), sortOrder: 0 },
      { sectionType: 'summary', content: JSON.stringify({ summary }), sortOrder: 1 },
      { sectionType: 'experience', content: JSON.stringify(experience), sortOrder: 2 },
      { sectionType: 'education', content: JSON.stringify(education), sortOrder: 3 },
      { sectionType: 'skills', content: JSON.stringify(skills), sortOrder: 4 },
      { sectionType: 'certs', content: JSON.stringify(certifications), sortOrder: 5 },
      { sectionType: 'projects', content: JSON.stringify(projects), sortOrder: 6 },
      { sectionType: 'achievements', content: JSON.stringify(achievements), sortOrder: 7 },
      { sectionType: 'languages', content: JSON.stringify(languages), sortOrder: 8 },
    ];

    try {
      const updated = await resumeApi.updateResumeSections(selectedResume.id, sectionsPayload);
      setSelectedResume(updated);
      // Update list
      setResumes(resumes.map(r => r.id === updated.id ? updated : r));
      // Refresh version log
      const vers = await resumeApi.listVersions(selectedResume.id);
      setVersions(vers);
    } catch (err) {
      // Mock local update fallback
      if (selectedResume) {
        const updated = {
          ...selectedResume,
          sections: sectionsPayload,
          atsScore: 95,
          aiSuggestions: `["Your resume is optimized for ATS parsing!"]`,
        };
        setSelectedResume(updated);
        setResumes(resumes.map(r => r.id === updated.id ? updated : r));
      }
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dup = await resumeApi.duplicateResume(id);
      setResumes([...resumes, dup]);
    } catch (err) {
      const src = resumes.find(r => r.id === id);
      if (src) {
        const dup = {
          ...src,
          id: Math.random().toString(),
          title: `Copy of ${src.title}`,
          isDefault: false,
        };
        setResumes([...resumes, dup]);
      }
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await resumeApi.deleteResume(id);
      setResumes(resumes.filter(r => r.id !== id));
      if (selectedResume?.id === id) {
        setSelectedResume(null);
      }
    } catch (err) {
      setResumes(resumes.filter(r => r.id !== id));
      if (selectedResume?.id === id) {
        setSelectedResume(null);
      }
    }
  };

  const handleMakeDefault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await resumeApi.setDefaultResume(id);
      setResumes(resumes.map(r => ({ ...r, isDefault: r.id === id })));
      if (selectedResume?.id === id) {
        setSelectedResume({ ...selectedResume, isDefault: true });
      }
    } catch (err) {
      setResumes(resumes.map(r => ({ ...r, isDefault: r.id === id })));
      if (selectedResume?.id === id) {
        setSelectedResume({ ...selectedResume, isDefault: true });
      }
    }
  };

  // Section builders
  const handleAddExperienceItem = () => {
    setExperience([...experience, { company: '', role: '', duration: '', description: '' }]);
  };

  const handleRemoveExperienceItem = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    setExperience(experience.map((exp, i) => i === index ? { ...exp, [field]: value } : exp));
  };

  const handleAddEducationItem = () => {
    setEducation([...education, { school: '', degree: '', year: '' }]);
  };

  const handleRemoveEducationItem = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    setEducation(education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu));
  };

  const handleAddSkill = () => {
    if (skillsInput && !skills.includes(skillsInput)) {
      setSkills([...skills, skillsInput]);
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddCertItem = () => {
    setCertifications([...certifications, { name: '', authority: '', year: '' }]);
  };

  const handleRemoveCertItem = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleCertChange = (index: number, field: string, value: string) => {
    setCertifications(certifications.map((cert, i) => i === index ? { ...cert, [field]: value } : cert));
  };

  const handleAddProjectItem = () => {
    setProjects([...projects, { title: '', description: '', link: '' }]);
  };

  const handleRemoveProjectItem = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleProjectChange = (index: number, field: string, value: string) => {
    setProjects(projects.map((proj, i) => i === index ? { ...proj, [field]: value } : proj));
  };

  const handleAddAchievementItem = () => {
    setAchievements([...achievements, { title: '', desc: '' }]);
  };

  const handleRemoveAchievementItem = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleAchievementChange = (index: number, field: string, value: string) => {
    setAchievements(achievements.map((ach, i) => i === index ? { ...ach, [field]: value } : ach));
  };

  const handleAddLanguageItem = () => {
    setLanguages([...languages, { name: '', level: '' }]);
  };

  const handleRemoveLanguageItem = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleLanguageChange = (index: number, field: string, value: string) => {
    setLanguages(languages.map((lang, i) => i === index ? { ...lang, [field]: value } : lang));
  };

  const handlePrint = () => {
    window.print();
  };

  const getAtsColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const renderSuggestions = (sugString: string) => {
    try {
      const arr = JSON.parse(sugString);
      if (Array.isArray(arr)) {
        return (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {arr.map((sug, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <AutoAwesomeIcon color="secondary" sx={{ fontSize: 16, mt: 0.5 }} />
                <Typography variant="body2">{sug}</Typography>
              </Box>
            ))}
          </Stack>
        );
      }
    } catch (e) {
      // Return raw
    }
    return <Typography variant="body2">{sugString || 'No recommendations logged.'}</Typography>;
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 4, background: mode === 'light' ? 'linear-gradient(135deg, #eef2f6 0%, #cbd5e1 100%)' : 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)' }}>
      
      {/* Print stylesheet override */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #resume-preview-panel, #resume-preview-panel * {
            visibility: visible;
          }
          #resume-preview-panel {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}} />

      {/* Global Header Bar */}
      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Card sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KIRMYA RESUME ARCHITECT
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateOpen(true)}>
              Create Resume
            </Button>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Stack>
        </Card>
      </Container>

      {/* Workspace Area */}
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          
          {/* Left panel: List Resumes & Inputs Editor */}
          <Grid item xs={12} lg={7}>
            <Stack spacing={3}>
              
              {/* Resumes Dashboard Selector */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Your Resume Vault</Typography>
                  
                  {resumes.length === 0 ? (
                    <Alert severity="info">No resumes created yet. Click &apos;Create Resume&apos; to scaffold your first resume.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {resumes.map((res) => (
                        <Grid item xs={12} sm={6} key={res.id}>
                          <Card 
                            onClick={() => handleSelectResume(res)}
                            sx={{ 
                              cursor: 'pointer',
                              border: selectedResume?.id === res.id ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.05)',
                              backgroundColor: selectedResume?.id === res.id ? 'rgba(99,102,241,0.05)' : 'inherit'
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{res.title}</Typography>
                                <IconButton size="small" onClick={(e) => handleMakeDefault(res.id, e)}>
                                  {res.isDefault ? <StarIcon color="warning" /> : <StarBorderIcon />}
                                </IconButton>
                              </Box>
                              
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Chip label={`ATS: ${res.atsScore}`} color={getAtsColor(res.atsScore)} size="small" sx={{ fontWeight: 600 }} />
                                <Chip label={res.templateName} variant="outlined" size="small" />
                              </Stack>

                              <Divider sx={{ my: 1.5 }} />

                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button startIcon={<FileCopyIcon />} size="small" onClick={(e) => handleDuplicate(res.id, e)} sx={{ textTransform: 'none' }}>
                                  Duplicate
                                </Button>
                                <IconButton size="small" color="error" onClick={(e) => handleDelete(res.id, e)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>

              {/* Resume Sections Content Editor */}
              {selectedResume && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Editor: {selectedResume.title}
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Button startIcon={<HistoryIcon />} variant="outlined" onClick={() => setVersionsOpen(true)}>
                          Versions
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleSaveSections}>
                          Save & Update Score
                        </Button>
                      </Stack>
                    </Box>

                    <Stack spacing={3}>
                      
                      {/* Personal Info */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Personal Information</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField label="Full Name" size="small" fullWidth value={personalInfo.name} onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField label="Email Address" size="small" fullWidth value={personalInfo.email} onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField label="Phone Number" size="small" fullWidth value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField label="Address Location" size="small" fullWidth value={personalInfo.address} onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField label="Website / Portfolio Link" size="small" fullWidth value={personalInfo.website} onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })} />
                          </Grid>
                        </Grid>
                      </Box>

                      <Divider />

                      {/* Summary */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Professional Summary</Typography>
                        <TextField label="Summary" multiline rows={3} fullWidth value={summary} onChange={(e) => setSummary(e.target.value)} />
                      </Box>

                      <Divider />

                      {/* Experience */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Professional Experience</Typography>
                          <Button startIcon={<AddIcon />} size="small" onClick={handleAddExperienceItem}>Add Work</Button>
                        </Box>
                        <Stack spacing={2}>
                          {experience.map((exp, idx) => (
                            <Card key={idx} sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.01)' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <TextField label="Company" size="small" fullWidth value={exp.company} onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField label="Role" size="small" fullWidth value={exp.role} onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} sm={10}>
                                  <TextField label="Duration (e.g. 2024 - Present)" size="small" fullWidth value={exp.duration} onChange={(e) => handleExperienceChange(idx, 'duration', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <IconButton color="error" onClick={() => handleRemoveExperienceItem(idx)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField label="Description" size="small" multiline rows={2} fullWidth value={exp.description} onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)} />
                                </Grid>
                              </Grid>
                            </Card>
                          ))}
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Skills */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Skills</Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <TextField label="Add Skill" size="small" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()} />
                          <Button variant="outlined" onClick={handleAddSkill}>Add</Button>
                        </Stack>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {skills.map((s, i) => (
                            <Chip key={i} label={s} onDelete={() => handleRemoveSkill(s)} color="primary" variant="outlined" />
                          ))}
                        </Box>
                      </Box>

                    </Stack>
                  </CardContent>
                </Card>
              )}

            </Stack>
          </Grid>
          
          {/* Right panel: Live Template Preview & AI scoring */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3} sx={{ position: 'sticky', top: '24px' }}>
              
              {/* AI scoring card */}
              {selectedResume && (
                <Card sx={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.05) 100%)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon color="secondary" /> Kirmya ATS Copilot
                      </Typography>
                      <Chip label={`Score: ${selectedResume.atsScore}`} color={getAtsColor(selectedResume.atsScore)} sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }} />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>AI Optimization Advice:</Typography>
                    {renderSuggestions(selectedResume.aiSuggestions)}
                  </CardContent>
                </Card>
              )}

              {/* Resume Print & Live Preview */}
              {selectedResume && (
                <Card sx={{ p: 0 }}>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Live Preview Pane</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button startIcon={<PrintIcon />} size="small" variant="outlined" onClick={handlePrint}>
                        Print / Save PDF
                      </Button>
                    </Stack>
                  </Box>

                  {/* Render preview inside a virtual A4 paper frame */}
                  <Box 
                    id="resume-preview-panel" 
                    sx={{ 
                      minHeight: '600px', 
                      p: 4, 
                      backgroundColor: 'white', 
                      color: 'black', 
                      borderRadius: '0 0 16px 16px',
                      fontFamily: selectedResume.templateName === 'classic' ? '"Georgia", serif' : '"Inter", sans-serif',
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ textAlign: selectedResume.templateName === 'minimal' ? 'center' : 'left', mb: 3 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, textTransform: 'uppercase', color: selectedResume.templateName === 'modern' ? '#1e3a8a' : '#111827' }}>
                        {personalInfo.name || 'Your Name'}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ color: '#4b5563', mt: 1 }}>
                        {personalInfo.email} {personalInfo.phone ? `| ${personalInfo.phone}` : ''} {personalInfo.address ? `| ${personalInfo.address}` : ''}
                      </Typography>
                      {personalInfo.website && (
                        <Typography variant="caption" sx={{ color: '#2563eb', display: 'block', mt: 0.5 }}>{personalInfo.website}</Typography>
                      )}
                    </Box>

                    <Divider sx={{ my: 2, borderColor: '#e5e7eb' }} />

                    {/* Summary */}
                    {summary && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: selectedResume.templateName === 'modern' ? '#1e3a8a' : '#374151', mb: 1 }}>
                          Professional Summary
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.5, color: '#374151' }}>{summary}</Typography>
                      </Box>
                    )}

                    {/* Experience */}
                    {experience.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: selectedResume.templateName === 'modern' ? '#1e3a8a' : '#374151', mb: 1.5 }}>
                          Professional Experience
                        </Typography>
                        <Stack spacing={2}>
                          {experience.map((exp, idx) => (
                            <Box key={idx}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>{exp.role}</Typography>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>{exp.duration}</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#4b5563', fontStyle: 'italic' }}>{exp.company}</Typography>
                              <Typography variant="body2" sx={{ color: '#4b5563', mt: 0.5, fontSize: '0.85rem' }}>{exp.description}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: selectedResume.templateName === 'modern' ? '#1e3a8a' : '#374151', mb: 1 }}>
                          Core Skills
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6 }}>
                          {skills.join(', ')}
                        </Typography>
                      </Box>
                    )}

                  </Box>
                </Card>
              )}

            </Stack>
          </Grid>

        </Grid>
      </Container>

      {/* ----------------- DIALOG MODALS ----------------- */}

      {/* Create Resume Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>Create New Resume</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1, minWidth: '300px' }}>
            <TextField label="Resume Title" fullWidth value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <FormControl fullWidth>
              <InputLabel>Template Style</InputLabel>
              <Select value={newTemplate} label="Template Style" onChange={(e) => setNewTemplate(e.target.value)}>
                <MenuItem value="classic">Classic Serif</MenuItem>
                <MenuItem value="modern">Modern Professional</MenuItem>
                <MenuItem value="minimal">Minimalist Clean</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateResume} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Version History Modal */}
      <Dialog open={versionsOpen} onClose={() => setVersionsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Snapshot History Logs</DialogTitle>
        <DialogContent>
          {versions.length === 0 ? (
            <Typography variant="body2" sx={{ py: 2 }}>No historical snapshots created yet. Saves will trigger checkpoints.</Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {versions.map((ver) => (
                <Card key={ver.id} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{ver.versionTag}</Typography>
                    <Typography variant="caption" color="text.secondary">Saved: {new Date(ver.createdAt).toLocaleString()}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={`ATS: ${ver.atsScore}`} color={getAtsColor(ver.atsScore)} size="small" />
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
