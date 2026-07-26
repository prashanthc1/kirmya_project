'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  LinearProgress,
  Divider,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import DomainIcon from '@mui/icons-material/Domain';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SecurityIcon from '@mui/icons-material/Security';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { organizationApi } from '../../features/organization/api';
import {
  Organization,
  OrganizationUser,
  OrganizationPermission,
  OrgType,
  OrgRole,
} from '../../features/organization/types';

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationUser[]>([]);
  const [permissions, setPermissions] = useState<OrganizationPermission[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<OrgType>('company');
  const [newTenantDomain, setNewTenantDomain] = useState('');

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('recruiter');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resOrgs, resPerms] = await Promise.allSettled([
        organizationApi.getOrganizationsForUser(),
        organizationApi.getAllPermissions(),
      ]);

      if (resOrgs.status === 'fulfilled') {
        const orgList = resOrgs.value?.data || mockOrgs;
        setOrganizations(orgList);
        if (!activeOrg && orgList.length > 0) {
          setActiveOrg(orgList[0]);
          fetchOrgMembers(orgList[0].id);
        }
      } else {
        setOrganizations(mockOrgs);
        setActiveOrg(mockOrgs[0]);
      }

      if (resPerms.status === 'fulfilled') {
        setPermissions(resPerms.value?.data || mockPermissions);
      } else {
        setPermissions(mockPermissions);
      }
    } catch (err) {
      console.error(err);
      setOrganizations(mockOrgs);
      setActiveOrg(mockOrgs[0]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgMembers = async (orgId: string) => {
    try {
      const res = await organizationApi.getOrgMembers(orgId);
      setMembers(res.data || mockMembers);
    } catch (err) {
      setMembers(mockMembers);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSwitchTenant = (org: Organization) => {
    setActiveOrg(org);
    localStorage.setItem('active_tenant_id', org.id);
    fetchOrgMembers(org.id);
  };

  const handleCreateOrg = async () => {
    try {
      setLoading(true);
      const domainName = newTenantDomain || `${newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '')}.tenant`;
      await organizationApi.createOrganization({
        name: newOrgName,
        org_type: newOrgType,
        tenant_domain: domainName,
        tier: 'enterprise',
      });
      setCreateOrgOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      await organizationApi.addMember(activeOrg.id, {
        user_email: inviteEmail,
        user_name: inviteName,
        role: inviteRole,
      });
      setInviteModalOpen(false);
      await fetchOrgMembers(activeOrg.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mockOrgs: Organization[] = [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Default Kirmya Enterprise Tenant',
      org_type: 'company',
      tenant_domain: 'kirmya-default.tenant',
      status: 'active',
      tier: 'enterprise',
      member_count: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'org22222-2222-2222-2222-222222222222',
      name: 'TechCorp Global Recruiting Agency',
      org_type: 'recruiter_agency',
      tenant_domain: 'techcorp-agency.tenant',
      status: 'active',
      tier: 'enterprise',
      member_count: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'org33333-3333-3333-3333-333333333333',
      name: 'Kirmya Leadership Academy',
      org_type: 'training_provider',
      tenant_domain: 'leadership-academy.tenant',
      status: 'active',
      tier: 'pro',
      member_count: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockMembers: OrganizationUser[] = [
    {
      id: 'm1',
      org_id: '00000000-0000-0000-0000-000000000000',
      user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      user_name: 'Alex Rivera',
      user_email: 'alex.rivera@example.com',
      role: 'org_admin',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      org_id: '00000000-0000-0000-0000-000000000000',
      user_id: 'u2',
      user_name: 'Sarah Jenkins',
      user_email: 'sarah.j@techcorp.com',
      role: 'recruiter',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ];

  const mockPermissions: OrganizationPermission[] = [
    { id: 'p1', role: 'org_admin', resource: 'interviews', action: 'manage', created_at: '' },
    { id: 'p2', role: 'org_admin', resource: 'assessments', action: 'manage', created_at: '' },
    { id: 'p3', role: 'recruiter', resource: 'interviews', action: 'write', created_at: '' },
    { id: 'p4', role: 'recruiter', resource: 'verifications', action: 'write', created_at: '' },
    { id: 'p5', role: 'instructor', resource: 'learning', action: 'write', created_at: '' },
    { id: 'p6', role: 'instructor', resource: 'assessments', action: 'write', created_at: '' },
    { id: 'p7', role: 'viewer', resource: 'organization', action: 'read', created_at: '' },
  ];

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Enterprise Organization & Multi-Tenant Studio
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Manage enterprise tenant isolation across Companies, Recruiter Agencies, and Training Providers with RBAC permission controls.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => setCreateOrgOpen(true)}
            startIcon={<AddIcon />}
            sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: '#0284c7' } }}
          >
            Create Organization
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Active Tenant Context Bar */}
        <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DomainIcon sx={{ color: '#38bdf8', fontSize: 32 }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Active Enterprise Tenant Context:</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                {activeOrg?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                Domain: {activeOrg?.tenant_domain} • Tier: {activeOrg?.tier.toUpperCase()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHorizIcon sx={{ color: '#10b981' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Switch Workspace:</Typography>
            <Select
              value={activeOrg?.id || ''}
              size="small"
              onChange={(e) => {
                const target = organizations.find((o) => o.id === e.target.value);
                if (target) handleSwitchTenant(target);
              }}
              sx={{ color: '#fff', bgcolor: '#0f172a', minWidth: 240, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            >
              {organizations.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name} ({org.org_type.replace('_', ' ')})
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Paper>

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Organization Catalog" />
            <Tab icon={<GroupAddIcon fontSize="small" />} iconPosition="start" label="Team Members & Roles" />
            <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="RBAC Permission Matrix" />
          </Tabs>
        </Paper>

        {/* Tab 0: Organization Catalog */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {organizations.map((org) => (
              <Grid item xs={12} md={4} key={org.id}>
                <Card sx={{ bgcolor: '#1e293b', border: org.id === activeOrg?.id ? '2px solid #38bdf8' : '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        label={org.org_type.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', fontWeight: 'bold' }}
                      />
                      <Chip label={org.tier.toUpperCase()} size="small" sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                      {org.name}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace', mb: 2, display: 'block' }}>
                      Tenant Domain: {org.tenant_domain}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2, flexGrow: 1 }}>
                      Active Members: {org.member_count || 1} enterprise users assigned.
                    </Typography>

                    <Button
                      variant={org.id === activeOrg?.id ? 'outlined' : 'contained'}
                      fullWidth
                      onClick={() => handleSwitchTenant(org)}
                      startIcon={org.id === activeOrg?.id ? <CheckCircleIcon /> : <SwapHorizIcon />}
                      sx={{
                        bgcolor: org.id === activeOrg?.id ? 'transparent' : '#38bdf8',
                        color: org.id === activeOrg?.id ? '#38bdf8' : '#0f172a',
                        borderColor: org.id === activeOrg?.id ? '#38bdf8' : 'transparent',
                        fontWeight: 'bold',
                        py: 1,
                      }}
                    >
                      {org.id === activeOrg?.id ? 'Active Tenant Workspace' : 'Switch to Tenant'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Team Members & Roles */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                Members in {activeOrg?.name} ({members.length})
              </Typography>
              <Button
                variant="contained"
                onClick={() => setInviteModalOpen(true)}
                startIcon={<GroupAddIcon />}
                sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
              >
                Invite Team Member
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #334155' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Member Name</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Email Address</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Assigned Role</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id} sx={{ borderBottom: '1px solid #1e293b' }}>
                      <TableCell sx={{ color: '#f8fafc', fontWeight: 'bold' }}>{m.user_name}</TableCell>
                      <TableCell sx={{ color: '#38bdf8' }}>{m.user_email}</TableCell>
                      <TableCell>
                        <Chip
                          label={m.role.replace('_', ' ').toUpperCase()}
                          size="small"
                          sx={{ bgcolor: m.role === 'org_admin' ? '#a855f7' : '#0f172a', color: m.role === 'org_admin' ? '#fff' : '#38bdf8', border: '1px solid #334155', fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={m.status.toUpperCase()} size="small" sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Tab 2: RBAC Permission Matrix */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
              Role-Based Access Control (RBAC) Matrix
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #334155' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Target Resource</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Allowed Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((p) => (
                    <TableRow key={p.id} sx={{ borderBottom: '1px solid #1e293b' }}>
                      <TableCell>
                        <Chip label={p.role.replace('_', ' ').toUpperCase()} size="small" sx={{ bgcolor: '#1e293b', color: '#38bdf8', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#f8fafc', fontWeight: 'bold' }}>{p.resource}</TableCell>
                      <TableCell sx={{ color: p.action === 'manage' ? '#a855f7' : '#10b981', fontWeight: 'bold' }}>
                        {p.action.toUpperCase()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Create Org Modal */}
        <Dialog open={createOrgOpen} onClose={() => setCreateOrgOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', fontWeight: 'bold' }}>
            Onboard Enterprise Organization
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Organization Name"
                  fullWidth
                  size="small"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>Organization Type:</Typography>
                <Select
                  value={newOrgType}
                  size="small"
                  fullWidth
                  onChange={(e) => setNewOrgType(e.target.value as OrgType)}
                  sx={{ color: '#fff', bgcolor: '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
                >
                  <MenuItem value="company">Employer Company</MenuItem>
                  <MenuItem value="recruiter_agency">Recruiting Agency</MenuItem>
                  <MenuItem value="training_provider">Training Provider / Academy</MenuItem>
                </Select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tenant Subdomain"
                  fullWidth
                  size="small"
                  value={newTenantDomain}
                  onChange={(e) => setNewTenantDomain(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
            <Button onClick={() => setCreateOrgOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleCreateOrg} variant="contained" sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
              Create Organization
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invite Member Modal */}
        <Dialog open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', fontWeight: 'bold' }}>
            Invite Member to {activeOrg?.name}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Member Name"
                  fullWidth
                  size="small"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  fullWidth
                  size="small"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>Assign RBAC Role:</Typography>
                <Select
                  value={inviteRole}
                  size="small"
                  fullWidth
                  onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                  sx={{ color: '#fff', bgcolor: '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
                >
                  <MenuItem value="org_admin">Org Admin (Full Management)</MenuItem>
                  <MenuItem value="recruiter">Recruiter (Interviews & Candidates)</MenuItem>
                  <MenuItem value="instructor">Instructor (Courses & Assessments)</MenuItem>
                  <MenuItem value="viewer">Viewer (Read Only)</MenuItem>
                </Select>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
            <Button onClick={() => setInviteModalOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleInviteMember} variant="contained" sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
              Send Invite
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
