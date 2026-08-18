'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import PolicyIcon from '@mui/icons-material/Policy';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ShieldIcon from '@mui/icons-material/Shield';
import { trustSafetyApi } from '../../features/trust_safety/services/trustSafetyApi';
import { SafetyPolicyItem } from '../../features/trust_safety/types';

export const SafetyPolicyStudio: React.FC = () => {
  const [policies, setPolicies] = useState<SafetyPolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');

  // Modal State
  const [editModal, setEditModal] = useState<SafetyPolicyItem | null>(null);
  const [isNewPolicy, setIsNewPolicy] = useState(false);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Job Safety');
  const [formDescription, setFormDescription] = useState('');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formSeverity, setFormSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [formPenalty, setFormPenalty] = useState('');
  const [formThreshold, setFormThreshold] = useState<number>(75);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadPolicies = async () => {
    try {
      const data = await trustSafetyApi.getSafetyPolicies();
      setPolicies(data || []);
    } catch {
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleOpenEdit = (p: SafetyPolicyItem) => {
    setIsNewPolicy(false);
    setEditModal(p);
    setFormCode(p.code);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormDescription(p.description);
    setFormVersion(p.version);
    setFormSeverity(p.severity);
    setFormStatus(p.status);
    setFormPenalty(p.default_penalty);
    setFormThreshold(p.auto_enforcement_threshold || 75);
  };

  const handleOpenCreate = () => {
    setIsNewPolicy(true);
    setEditModal({
      id: '',
      code: 'POL-NEW',
      title: '',
      category: 'Job Safety',
      description: '',
      version: 'v1.0',
      severity: 'high',
      status: 'active',
      default_penalty: '',
      auto_enforcement_threshold: 75,
      updated_at: new Date().toISOString(),
      effective_date: new Date().toISOString().split('T')[0],
    });
    setFormCode('POL-NEW');
    setFormTitle('');
    setFormCategory('Job Safety');
    setFormDescription('');
    setFormVersion('v1.0');
    setFormSeverity('high');
    setFormStatus('active');
    setFormPenalty('Warning & Review');
    setFormThreshold(75);
  };

  const handleSavePolicy = async () => {
    if (!editModal) return;
    if (isNewPolicy) {
      await trustSafetyApi.createSafetyPolicy({
        code: formCode,
        title: formTitle,
        category: formCategory,
        description: formDescription,
        version: formVersion,
        severity: formSeverity,
        status: formStatus,
        default_penalty: formPenalty,
        auto_enforcement_threshold: formThreshold,
        effective_date: new Date().toISOString().split('T')[0],
      });
      setStatusMsg(`Created new policy ${formCode} successfully.`);
    } else {
      await trustSafetyApi.updateSafetyPolicy(editModal.id, {
        code: formCode,
        title: formTitle,
        category: formCategory,
        description: formDescription,
        version: formVersion,
        severity: formSeverity,
        status: formStatus,
        default_penalty: formPenalty,
        auto_enforcement_threshold: formThreshold,
      });
      setStatusMsg(`Updated policy ${formCode} (${formVersion}) successfully.`);
    }
    setEditModal(null);
    loadPolicies();
  };

  const getSeverityBadge = (severity: SafetyPolicyItem['severity']) => {
    switch (severity) {
      case 'critical':
        return <Chip label="CRITICAL" color="error" size="small" sx={{ fontWeight: 900 }} />;
      case 'high':
        return <Chip label="HIGH" color="warning" size="small" sx={{ fontWeight: 900 }} />;
      case 'medium':
        return <Chip label="MEDIUM" color="info" size="small" sx={{ fontWeight: 800 }} />;
      case 'low':
      default:
        return <Chip label="LOW" color="default" size="small" sx={{ fontWeight: 700 }} />;
    }
  };

  const categories = ['All', 'Job Safety', 'Platform Integrity', 'Communication', 'Privacy'];

  const filteredPolicies = policies.filter(
    (p) => selectedCategoryTab === 'All' || p.category.toLowerCase() === selectedCategoryTab.toLowerCase()
  );

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PolicyIcon color="primary" /> Platform Safety Policy Studio
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Central repository of platform compliance guidelines, enforcement penalties, and automated threshold rules.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: '12px', fontWeight: 900, px: 2.5 }}
        >
          Create Safety Policy
        </Button>
      </Stack>

      {statusMsg && (
        <Alert severity="success" onClose={() => setStatusMsg(null)} sx={{ mb: 2, borderRadius: '12px' }}>
          {statusMsg}
        </Alert>
      )}

      {/* Category Tabs */}
      <Tabs
        value={selectedCategoryTab}
        onChange={(_, val) => setSelectedCategoryTab(val)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {categories.map((cat) => (
          <Tab key={cat} label={cat} value={cat} sx={{ fontWeight: 800 }} />
        ))}
      </Tabs>

      {/* Policies Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredPolicies.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No safety policies found for the selected category.
        </Alert>
      ) : (
        <Grid container spacing={2.5}>
          {filteredPolicies.map((p) => (
            <Grid item xs={12} md={6} key={p.id || p.code}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Box>
                      <Chip label={p.code} size="small" color="primary" variant="outlined" sx={{ fontWeight: 900, mb: 0.5 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {p.title}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={p.version} size="small" sx={{ fontWeight: 800, background: 'rgba(0,0,0,0.06)' }} />
                      {getSeverityBadge(p.severity)}
                    </Stack>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {p.description}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      <strong>Default Enforcement:</strong> {p.default_penalty}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Auto-Enforcement Threshold: Risk Score ≥ <strong>{p.auto_enforcement_threshold || 75}</strong>
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.5, pt: 1.5, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Chip
                    label={p.status.toUpperCase()}
                    color={p.status === 'active' ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEdit(p)}
                    sx={{ borderRadius: '8px', fontWeight: 800 }}
                  >
                    Edit Policy Matrix
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit / Create Policy Modal */}
      <Dialog
        open={Boolean(editModal)}
        onClose={() => setEditModal(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { borderRadius: 24, backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.95)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>{isNewPolicy ? 'Create New Safety Policy' : 'Edit Safety Policy Matrix'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Policy Code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="e.g. POL-ADVANCE-FEE"
                fullWidth
              />
              <TextField
                label="Version"
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                placeholder="e.g. v2.1"
                sx={{ width: 140 }}
              />
            </Stack>

            <TextField
              label="Policy Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Advance Fee Fraud Prevention Policy"
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={formCategory} label="Category" onChange={(e) => setFormCategory(e.target.value)}>
                <MenuItem value="Job Safety">Job Safety</MenuItem>
                <MenuItem value="Platform Integrity">Platform Integrity</MenuItem>
                <MenuItem value="Communication">Communication</MenuItem>
                <MenuItem value="Privacy">Privacy</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Policy Guidelines & Rationale"
              multiline
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select value={formSeverity} label="Severity" onChange={(e) => setFormSeverity(e.target.value as any)}>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formStatus} label="Status" onChange={(e) => setFormStatus(e.target.value as any)}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Default Penalty Action"
              value={formPenalty}
              onChange={(e) => setFormPenalty(e.target.value)}
              placeholder="e.g. Content Removal & Account Suspension"
              fullWidth
            />

            <TextField
              label="Auto Enforcement Risk Score Threshold (0-100)"
              type="number"
              value={formThreshold}
              onChange={(e) => setFormThreshold(Number(e.target.value))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditModal(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSavePolicy} sx={{ borderRadius: '12px', fontWeight: 900 }}>
            Save Policy Matrix
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SafetyPolicyStudio;
