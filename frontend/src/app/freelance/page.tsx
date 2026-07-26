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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import AssignmentCheckIcon from '@mui/icons-material/AssignmentTurnedIn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CodeIcon from '@mui/icons-material/Code';

import { freelanceApi } from '../../features/freelance/api';
import {
  Contract,
  Project,
  Proposal,
} from '../../features/freelance/types';

export default function FreelanceMarketplacePage() {
  const [tabValue, setTabValue] = useState<number>(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Submit Proposal Modal State
  const [openProposalModal, setOpenProposalModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(1400);
  const [estimatedDays, setEstimatedDays] = useState<number>(5);
  const [coverLetter, setCoverLetter] = useState<string>(
    'I have 5+ years of experience in Go microservices and PostgreSQL performance optimization. I can deliver this within 5 days.'
  );

  // Post Project Modal State
  const [openPostModal, setOpenPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBudget, setNewBudget] = useState(1200);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        freelanceApi.getProjects('ALL'),
        freelanceApi.getContracts(),
      ]);
      setProjects(pRes.data || []);
      setContracts(cRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProposal = (proj: Project) => {
    setSelectedProject(proj);
    setBidAmount(proj.budget);
    setOpenProposalModal(true);
  };

  const handleSubmitProposal = async () => {
    if (!selectedProject) return;
    try {
      await freelanceApi.submitProposal(selectedProject.id, {
        bid_amount: Number(bidAmount),
        estimated_days: Number(estimatedDays),
        cover_letter: coverLetter,
      });
      setOpenProposalModal(false);
      setSuccessMsg(`Proposal submitted successfully for "${selectedProject.title}"`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async () => {
    try {
      await freelanceApi.createProject({
        title: newTitle,
        description: newDesc,
        budget: Number(newBudget),
        budget_type: 'fixed',
        skills_required: ['Go', 'React', 'TypeScript'],
      });
      setOpenPostModal(false);
      setSuccessMsg('New short-term gig project posted successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#10b981', p: 1.5, borderRadius: 2, color: '#0f172a', display: 'flex' }}>
              <WorkIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya Freelance & Gig Marketplace
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Helping transitioning professionals earn income through short-term contract opportunities
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenPostModal(true)}
            sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold', px: 3, py: 1.2 }}
          >
            Post Short-Term Project
          </Button>
        </Box>

        {successMsg && (
          <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 3, bgcolor: '#064e3b', color: '#6ee7b7' }}>
            {successMsg}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={(_, val) => setTabValue(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#10b981' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#10b981' },
            }}
          >
            <Tab label="Explore Open Projects" />
            <Tab label="My Active Contracts" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />}

        {/* Tab 0: Open Projects Grid */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {projects.map((proj) => (
              <Grid item xs={12} md={6} key={proj.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', flex: 1, mr: 1 }}>
                        {proj.title}
                      </Typography>
                      <Chip
                        label={proj.budget_type === 'fixed' ? `Fixed $${proj.budget}` : `$${proj.budget}/hr`}
                        sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold' }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2.5, lineHeight: 1.6 }}>
                      {proj.description}
                    </Typography>

                    {/* Skills Required */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                      {proj.skills_required.map((skill, idx) => (
                        <Chip
                          key={idx}
                          icon={<CodeIcon fontSize="small" />}
                          label={skill}
                          size="small"
                          sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155' }}
                        />
                      ))}
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<SendIcon />}
                      onClick={() => handleOpenProposal(proj)}
                      sx={{ borderColor: '#10b981', color: '#10b981', fontWeight: 'bold', mt: 'auto' }}
                    >
                      Submit Proposal ({proj.proposals_count || 0} Proposals)
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Active Contracts */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {contracts.map((contract) => (
              <Grid item xs={12} md={6} key={contract.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                        {contract.project_title}
                      </Typography>
                      <Chip label="ACTIVE CONTRACT" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold', mb: 1 }}>
                      Total Agreed Value: ${contract.total_amount}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                      Contract ID: {contract.id}
                    </Typography>

                    <Button variant="contained" color="success" fullWidth startIcon={<AssignmentCheckIcon />}>
                      Mark Contract Completed
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Submit Proposal Modal */}
        <Dialog open={openProposalModal} onClose={() => setOpenProposalModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', border: '1px solid #334155' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#10b981' }}>
            Submit Proposal: {selectedProject?.title}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Your Bid Amount ($)"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
              <TextField
                label="Estimated Delivery (Days)"
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(Number(e.target.value))}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
              <TextField
                label="Cover Letter / Proposed Approach"
                multiline
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenProposalModal(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleSubmitProposal} variant="contained" sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold' }}>
              Send Proposal to Client
            </Button>
          </DialogActions>
        </Dialog>

        {/* Post Project Modal */}
        <Dialog open={openPostModal} onClose={() => setOpenPostModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', border: '1px solid #334155' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#10b981' }}>
            Post a Short-Term Gig Opportunity
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Project Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
              <TextField
                label="Detailed Scope / Requirements"
                multiline
                rows={4}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
              <TextField
                label="Budget ($)"
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(Number(e.target.value))}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenPostModal(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleCreateProject} variant="contained" sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold' }}>
              Publish Project
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
