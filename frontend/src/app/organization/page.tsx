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
  const [loadError, setLoadError] = useState<string | null>(null);

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

      // A user who belongs to no organization belongs to no organization. This
      // used to substitute an invented company, with invented members and
      // permissions, whenever the call failed or returned nothing.
      if (resOrgs.status === 'fulfilled') {
        const orgList = resOrgs.value?.data ?? [];
        setOrganizations(orgList);
        if (!activeOrg && orgList.length > 0) {
          setActiveOrg(orgList[0]);
          fetchOrgMembers(orgList[0].id);
        }
      } else {
        setOrganizations([]);
        setLoadError('Could not load your organizations. Try again shortly.');
      }

      if (resPerms.status === 'fulfilled') {
        setPermissions(resPerms.value?.data ?? []);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.error(err);
      setOrganizations([]);
      setLoadError('Could not load your organizations. Try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgMembers = async (orgId: string) => {
    try {
      const res = await organizationApi.getOrgMembers(orgId);
      setMembers(res.data ?? []);
    } catch (err) {
      setMembers([]);
      setLoadError('Could not load the members of this organization.');
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




  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh', color: 'text.primary', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{    }}>
              Enterprise Organization & Multi-Tenant Studio
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage enterprise tenant isolation across Companies, Recruiter Agencies, and Training Providers with RBAC permission controls.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => setCreateOrgOpen(true)}
            startIcon={<AddIcon />}
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: 'primary.main' } }}
          >
            Create Organization
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: 'background.paper', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />}

        {/* Active Tenant Context Bar */}
        <Paper sx={{ p: 2.5, mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DomainIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Active Enterprise Tenant Context:</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                {activeOrg?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontFamily: 'monospace' }}>
                Domain: {activeOrg?.tenant_domain} • Tier: {activeOrg?.tier.toUpperCase()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHorizIcon sx={{ color: 'success.main' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Switch Workspace:</Typography>
            <Select
              value={activeOrg?.id || ''}
              size="small"
              onChange={(e) => {
                const target = organizations.find((o) => o.id === e.target.value);
                if (target) handleSwitchTenant(target);
              }}
              sx={{ color: 'text.primary', bgcolor: 'background.default', minWidth: 240, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
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
        <Paper sx={{ mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
              '& .MuiTab-root': { color: 'text.secondary', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: 'primary.main' },
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
                <Card sx={{ bgcolor: 'background.paper', border: org.id === activeOrg?.id ? '2px solid #38bdf8' : '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        label={org.org_type.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{ bgcolor: 'background.default', color: 'primary.main', border: 1, borderColor: 'divider', fontWeight: 'bold' }}
                      />
                      <Chip label={org.tier.toUpperCase()} size="small" sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                      {org.name}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, display: 'block' }}>
                      Tenant Domain: {org.tenant_domain}
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'text.primary', mb: 2, flexGrow: 1 }}>
                      Active Members: {org.member_count || 1} enterprise users assigned.
                    </Typography>

                    <Button
                      variant={org.id === activeOrg?.id ? 'outlined' : 'contained'}
                      fullWidth
                      onClick={() => handleSwitchTenant(org)}
                      startIcon={org.id === activeOrg?.id ? <CheckCircleIcon /> : <SwapHorizIcon />}
                      sx={{
                        bgcolor: org.id === activeOrg?.id ? 'transparent' : "primary.main",
                        color: org.id === activeOrg?.id ? "primary.main" : "primary.contrastText",
                        borderColor: org.id === activeOrg?.id ? "primary.main" : 'transparent',
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
          <Paper sx={{ p: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
                Members in {activeOrg?.name} ({members.length})
              </Typography>
              <Button
                variant="contained"
                onClick={() => setInviteModalOpen(true)}
                startIcon={<GroupAddIcon />}
                sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}
              >
                Invite Team Member
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #334155' }}>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Member Name</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Email Address</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Assigned Role</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id} sx={{ borderBottom: '1px solid #1e293b' }}>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>{m.user_name}</TableCell>
                      <TableCell sx={{ color: 'primary.main' }}>{m.user_email}</TableCell>
                      <TableCell>
                        <Chip
                          label={m.role.replace('_', ' ').toUpperCase()}
                          size="small"
                          sx={{ bgcolor: m.role === 'org_admin' ? "primary.main" : "background.default", color: m.role === 'org_admin' ? "primary.contrastText" : "primary.main", border: 1, borderColor: 'divider', fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={m.status.toUpperCase()} size="small" sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold' }} />
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
          <Paper sx={{ p: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', mb: 2 }}>
              Role-Based Access Control (RBAC) Matrix
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #334155' }}>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Target Resource</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Allowed Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((p) => (
                    <TableRow key={p.id} sx={{ borderBottom: '1px solid #1e293b' }}>
                      <TableCell>
                        <Chip label={p.role.replace('_', ' ').toUpperCase()} size="small" sx={{ bgcolor: 'background.paper', color: 'primary.main', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>{p.resource}</TableCell>
                      <TableCell sx={{ color: p.action === 'manage' ? "primary.main" : '#10b981', fontWeight: 'bold' }}>
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
          <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', fontWeight: 'bold' }}>
            Onboard Enterprise Organization
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default', color: 'text.primary', p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Organization Name"
                  fullWidth
                  size="small"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Organization Type:</Typography>
                <Select
                  value={newOrgType}
                  size="small"
                  fullWidth
                  onChange={(e) => setNewOrgType(e.target.value as OrgType)}
                  sx={{ color: 'text.primary', bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
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
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Button onClick={() => setCreateOrgOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button onClick={handleCreateOrg} variant="contained" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Create Organization
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invite Member Modal */}
        <Dialog open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', fontWeight: 'bold' }}>
            Invite Member to {activeOrg?.name}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default', color: 'text.primary', p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Member Name"
                  fullWidth
                  size="small"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  fullWidth
                  size="small"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Assign RBAC Role:</Typography>
                <Select
                  value={inviteRole}
                  size="small"
                  fullWidth
                  onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                  sx={{ color: 'text.primary', bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
                >
                  <MenuItem value="org_admin">Org Admin (Full Management)</MenuItem>
                  <MenuItem value="recruiter">Recruiter (Interviews & Candidates)</MenuItem>
                  <MenuItem value="instructor">Instructor (Courses & Assessments)</MenuItem>
                  <MenuItem value="viewer">Viewer (Read Only)</MenuItem>
                </Select>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Button onClick={() => setInviteModalOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button onClick={handleInviteMember} variant="contained" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Send Invite
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
