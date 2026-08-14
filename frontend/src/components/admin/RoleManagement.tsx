'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  useTheme,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';

export const RoleManagement: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [roles] = useState([
    { code: 'super_admin', name: 'Super Administrator', userCount: 2, isSystem: true, description: 'Full unrestricted platform access' },
    { code: 'admin', name: 'Administrator', userCount: 5, isSystem: true, description: 'User management, moderation, and support oversight' },
    { code: 'moderator', name: 'Content Moderator', userCount: 12, isSystem: false, description: 'Report resolution and content moderation queue' },
    { code: 'support_agent', name: 'Support Desk Agent', userCount: 18, isSystem: false, description: 'User support ticket resolution' },
    { code: 'analytics_viewer', name: 'Analytics Viewer', userCount: 4, isSystem: false, description: 'Read-only dashboard metrics access' },
  ]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('moderator');
  const [success, setSuccess] = useState<string | null>(null);

  const handleAssign = () => {
    if (!targetEmail) return;
    setSuccess(`Role ${selectedRole.toUpperCase()} assigned successfully to ${targetEmail}.`);
    setAssignOpen(false);
    setTargetEmail('');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            Role-Based Access Control (RBAC)
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage administrative roles, granular permission matrices, and user role assignments.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AdminPanelSettingsIcon />}
          onClick={() => setAssignOpen(true)}
          sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}
        >
          Assign Admin Role
        </Button>
      </Stack>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Role Code & Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Assigned Admins</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.code}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {r.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {r.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.isSystem ? 'SYSTEM ROLE' : 'CUSTOM ROLE'}
                      color={r.isSystem ? 'primary' : 'default'}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={`${r.userCount} Admins`} variant="outlined" size="small" sx={{ fontWeight: 700 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Assign Administrative Role</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="User Email Address"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="e.g. moderator@kirmya.com"
              fullWidth
              required
            />
            <TextField
              select
              label="Role to Assign"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              fullWidth
            >
              {roles.map((r) => (
                <MenuItem key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} sx={{ borderRadius: '10px', fontWeight: 800 }}>
            Confirm Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
