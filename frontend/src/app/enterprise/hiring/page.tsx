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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import ShieldIcon from '@mui/icons-material/Shield';
import AddIcon from '@mui/icons-material/Add';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { enterpriseApi } from '../../../features/enterprise_hiring/api';
import {
  AuditLog,
  CandidatePool,
  Enterprise,
  HiringTeam,
} from '../../../features/enterprise_hiring/types';

export default function EnterpriseHiringWorkspacePage() {
  const [tabValue, setTabValue] = useState<number>(0);
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [teams, setTeams] = useState<HiringTeam[]>([]);
  const [pools, setPools] = useState<CandidatePool[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Team Modal
  const [openTeamModal, setOpenTeamModal] = useState(false);
  const [deptName, setDeptName] = useState('Core Infrastructure');
  const [teamName, setTeamName] = useState('Platform Performance Squad');

  // Create Pool Modal
  const [openPoolModal, setOpenPoolModal] = useState(false);
  const [poolName, setPoolName] = useState('Staff Level Distributed Systems Architects');
  const [poolDesc, setPoolDesc] = useState('Pre-vetted 95%+ match candidates for high-scale microservices');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eRes, tRes, pRes, aRes] = await Promise.all([
        enterpriseApi.getOverview(),
        enterpriseApi.getTeams(),
        enterpriseApi.getCandidatePools(),
        enterpriseApi.getAuditLogs(),
      ]);
      setEnterprise(eRes);
      setTeams(tRes.data || []);
      setPools(pRes.data || []);
      setAuditLogs(aRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      await enterpriseApi.createTeam({
        department_name: deptName,
        team_name: teamName,
      });
      setOpenTeamModal(false);
      setSuccessMsg(`Hiring team "${teamName}" created successfully!`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePool = async () => {
    try {
      await enterpriseApi.createCandidatePool({
        name: poolName,
        description: poolDesc,
      });
      setOpenPoolModal(false);
      setSuccessMsg(`Candidate talent pool "${poolName}" created successfully!`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100dvh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#38bdf8', p: 1.5, borderRadius: 2, color: '#0f172a', display: 'flex' }}>
              <BusinessIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Enterprise Hiring Solution & Governance
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {enterprise?.name || 'Stripe Global Enterprise'} • {enterprise?.industry || 'Fintech Infrastructure'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Chip icon={<VerifiedUserIcon />} label="ENTERPRISE PREMIUM TIER" color="primary" sx={{ fontWeight: 'bold' }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenTeamModal(true)} sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
              Create Hiring Team
            </Button>
          </Box>
        </Box>

        {successMsg && (
          <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 3, bgcolor: '#0c4a6e', color: '#38bdf8' }}>
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
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Hiring Teams & Departments" />
            <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Candidate Pools & Talent Pipelines" />
            <Tab icon={<ShieldIcon fontSize="small" />} iconPosition="start" label="Security Audit Logs" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Tab 0: Hiring Teams */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {teams.map((team) => (
              <Grid item xs={12} md={6} key={team.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="overline" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                        {team.department_name}
                      </Typography>
                      <Chip label={`${team.member_count} Recruiters`} size="small" sx={{ bgcolor: '#334155', color: '#fff' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 2 }}>
                      {team.team_name}
                    </Typography>

                    <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 2, border: '1px solid #334155' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Team Lead:</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#10b981' }}>
                        {team.team_lead_name}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Candidate Pools */}
        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenPoolModal(true)} sx={{ borderColor: '#38bdf8', color: '#38bdf8', fontWeight: 'bold' }}>
                New Talent Pipeline
              </Button>
            </Box>

            <Grid container spacing={3}>
              {pools.map((pool) => (
                <Grid item xs={12} md={6} key={pool.id}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                          {pool.name}
                        </Typography>
                        <Chip label={`${pool.candidate_count} Candidates`} color="primary" sx={{ fontWeight: 'bold' }} />
                      </Box>

                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                        {pool.description}
                      </Typography>

                      <Button variant="contained" fullWidth sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                        View Bulk Candidates Pipeline
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Tab 2: Security Audit Logs */}
        {tabValue === 2 && (
          <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#0f172a' }}>
                <TableRow>
                  <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>Actor</TableCell>
                  <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>Action</TableCell>
                  <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>Resource Affected</TableCell>
                  <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>IP Address</TableCell>
                  <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                    <TableCell sx={{ color: '#f8fafc', fontWeight: 'bold' }}>{log.actor_email}</TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small" sx={{ bgcolor: '#0284c7', color: '#fff', fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{log.resource}</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{log.ip_address}</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{new Date(log.created_at).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create Team Modal */}
        <Dialog open={openTeamModal} onClose={() => setOpenTeamModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', border: '1px solid #334155' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#38bdf8' }}>Create Enterprise Hiring Team</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Department Name"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
              <TextField
                label="Team / Squad Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenTeamModal(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleCreateTeam} variant="contained" sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
              Create Team
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Pool Modal */}
        <Dialog open={openPoolModal} onClose={() => setOpenPoolModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', border: '1px solid #334155' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#38bdf8' }}>Create Talent Pipeline</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Pipeline Name"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
              <TextField
                label="Target Criteria / Description"
                multiline
                rows={3}
                value={poolDesc}
                onChange={(e) => setPoolDesc(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenPoolModal(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleCreatePool} variant="contained" sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
              Create Talent Pool
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
