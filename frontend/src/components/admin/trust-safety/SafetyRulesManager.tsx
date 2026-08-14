'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  Switch,
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
  Box,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { safetyApi, updateSafetyRule } from '../../../features/trust_safety/api';
import { SafetyRule } from '../../../features/trust_safety/types';

export const SafetyRulesManager: React.FC = () => {
  const [rules, setRules] = useState<SafetyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<SafetyRule | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);

  // Edit form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('job_safety');
  const [triggerEvent, setTriggerEvent] = useState('job_created');
  const [conditions, setConditions] = useState('');
  const [action, setAction] = useState('flag_urgent_risk');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [isActive, setIsActive] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadRules = async () => {
    try {
      const data = await safetyApi.getSafetyRules();
      setRules(data || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleActive = async (rule: SafetyRule) => {
    const updated = await updateSafetyRule(rule.id, { is_active: !rule.is_active });
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    setStatusMsg(`Rule '${rule.name}' state toggled to ${!rule.is_active ? 'ACTIVE' : 'INACTIVE'}.`);
  };

  const handleOpenEdit = (rule: SafetyRule) => {
    setSelectedRule(rule);
    setIsNewRule(false);
    setName(rule.name);
    setCategory(rule.category);
    setTriggerEvent(rule.trigger_event);
    setConditions(rule.conditions);
    setAction(rule.action);
    setSeverity(rule.severity);
    setIsActive(rule.is_active);
  };

  const handleOpenCreate = () => {
    setSelectedRule({
      id: 'rule-' + Date.now(),
      name: '',
      category: 'job_safety',
      trigger_event: 'job_created',
      conditions: '',
      action: 'flag_urgent_risk',
      is_active: true,
      severity: 'high',
      created_at: new Date().toISOString(),
    });
    setIsNewRule(true);
    setName('');
    setCategory('job_safety');
    setTriggerEvent('job_created');
    setConditions('');
    setAction('flag_urgent_risk');
    setSeverity('high');
    setIsActive(true);
  };

  const handleSaveRule = async () => {
    if (!selectedRule || !name) return;
    const payload: Partial<SafetyRule> = {
      name,
      category,
      trigger_event: triggerEvent,
      conditions,
      action,
      severity,
      is_active: isActive,
    };
    await updateSafetyRule(selectedRule.id, payload);
    setStatusMsg(`Safety Rule '${name}' ${isNewRule ? 'created' : 'updated'} successfully.`);
    setSelectedRule(null);
    loadRules();
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return <Chip label="CRITICAL" color="error" size="small" sx={{ fontWeight: 900 }} />;
      case 'high':
        return <Chip label="HIGH" color="warning" size="small" sx={{ fontWeight: 900 }} />;
      case 'medium':
        return <Chip label="MEDIUM" color="info" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label="LOW" color="default" size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Automated Detection Safety Rules
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configure automated scam detection filters, keyword triggers, velocity limits, and risk scoring logic.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          Create Safety Rule
        </Button>
      </Stack>

      {statusMsg && (
        <Alert severity="success" onClose={() => setStatusMsg(null)} sx={{ mb: 2, borderRadius: '12px' }}>
          {statusMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Rule Name & ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Event Trigger</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Conditions</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Action Recommendation</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {r.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {r.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={r.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {r.trigger_event}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: 220 }}>
                      {r.conditions}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {r.action}
                    </Typography>
                  </TableCell>
                  <TableCell>{getSeverityBadge(r.severity)}</TableCell>
                  <TableCell>
                    <Switch checked={r.is_active} onChange={() => handleToggleActive(r)} color="success" size="small" />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEdit(r)}
                      sx={{ borderRadius: '8px', fontWeight: 800 }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit / Create Rule Dialog */}
      <Dialog open={Boolean(selectedRule)} onClose={() => setSelectedRule(null)} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{isNewRule ? 'Create Safety Detection Rule' : 'Edit Safety Detection Rule'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="Rule Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Detect Advance Wire Transfer Requests"
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="job_safety">Job Posting Safety</MenuItem>
                <MenuItem value="communication">Messaging & Off-Platform Chat</MenuItem>
                <MenuItem value="spam_prevention">Spam & High Velocity Outreach</MenuItem>
                <MenuItem value="impersonation">Recruiter Identity Verification</MenuItem>
                <MenuItem value="phishing">Malicious Content & Links</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Trigger Event</InputLabel>
              <Select value={triggerEvent} label="Trigger Event" onChange={(e) => setTriggerEvent(e.target.value)}>
                <MenuItem value="job_created">Job Posting Created / Updated</MenuItem>
                <MenuItem value="message_sent">Direct Message Sent</MenuItem>
                <MenuItem value="outreach_spike">Outreach Spike Triggered</MenuItem>
                <MenuItem value="account_login">Account Login Event</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Rule Logic / Expression Conditions"
              multiline
              rows={3}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder='e.g. text_contains(["wire_transfer", "gift_card"])'
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Automated Action Recommendation</InputLabel>
              <Select value={action} label="Automated Action Recommendation" onChange={(e) => setAction(e.target.value)}>
                <MenuItem value="flag_urgent_risk">Flag High Risk Score (90+)</MenuItem>
                <MenuItem value="warn_user_and_score">Show In-App Warning Banner</MenuItem>
                <MenuItem value="apply_posting_restriction">Apply Temporary Feature Restriction</MenuItem>
                <MenuItem value="require_id_verification">Require Identity Verification</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Rule Severity</InputLabel>
              <Select value={severity} label="Rule Severity" onChange={(e) => setSeverity(e.target.value as any)}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedRule(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveRule} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Save Rule Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SafetyRulesManager;
