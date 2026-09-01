import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import FlagIcon from '@mui/icons-material/Flag';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import { CommunityModerationAction, CommunityJoinRequest } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';

interface CommunityModerationDeskProps {
  communityId: string;
  actions: CommunityModerationAction[];
  joinRequests?: CommunityJoinRequest[];
  onActionResolved?: () => void;
}

export const CommunityModerationDesk: React.FC<CommunityModerationDeskProps> = ({
  communityId,
  actions: initialActions,
  joinRequests: initialJoinRequests = [],
  onActionResolved,
}) => {
  const [actions, setActions] = useState<CommunityModerationAction[]>(initialActions);
  const [joinRequests, setJoinRequests] = useState<CommunityJoinRequest[]>(initialJoinRequests);
  const [tabValue, setTabValue] = useState(0);

  // Dialog state for taking action
  const [selectedAction, setSelectedAction] = useState<CommunityModerationAction | null>(null);
  const [actionType, setActionType] = useState<
    'dismiss' | 'pin' | 'lock' | 'delete' | 'ban_user' | 'mute_user' | 'warn'
  >('dismiss');
  const [notes, setNotes] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const pendingReports = actions.filter((a) => a.status === 'pending');
  const resolvedActions = actions.filter((a) => a.status !== 'pending');
  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');

  const handleOpenActionModal = (
    action: CommunityModerationAction,
    type: 'dismiss' | 'pin' | 'lock' | 'delete' | 'ban_user' | 'mute_user' | 'warn'
  ) => {
    setSelectedAction(action);
    setActionType(type);
    setNotes('');
    setOpenDialog(true);
  };

  const handleResolveActionSubmit = async () => {
    if (!selectedAction) return;
    await communityApi.takeModerationAction(communityId, selectedAction.id, actionType, notes);
    setActions(
      actions.map((a) =>
        a.id === selectedAction.id
          ? {
              ...a,
              actionTaken: actionType,
              notes,
              status: actionType === 'dismiss' ? 'dismissed' : 'resolved',
              moderatorName: 'Current User',
            }
          : a
      )
    );
    setOpenDialog(false);
    if (onActionResolved) onActionResolved();
  };

  const handleApproveJoin = async (requestId: string, approve: boolean) => {
    await communityApi.approveMembership(communityId, requestId, approve);
    setJoinRequests(
      joinRequests.map((r) =>
        r.id === requestId ? { ...r, status: approve ? 'approved' : 'rejected' } : r
      )
    );
    if (onActionResolved) onActionResolved();
  };

  return (
    <Paper
      data-testid="community-moderation-desk"
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '20px',
        background: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(99, 102, 241, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <SecurityIcon color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight={800}>
          Community Moderation & Safety Desk
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
          <Tab
            icon={<FlagIcon />}
            iconPosition="start"
            label={`Flagged Reports (${pendingReports.length})`}
            sx={{ fontWeight: 700 }}
          />
          <Tab
            icon={<PersonAddIcon />}
            iconPosition="start"
            label={`Join Requests (${pendingRequests.length})`}
            sx={{ fontWeight: 700 }}
          />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label={`Moderation Audit Log (${resolvedActions.length})`}
            sx={{ fontWeight: 700 }}
          />
        </Tabs>
      </Box>

      {/* Tab 0: Flagged Reports */}
      {tabValue === 0 && (
        <Stack spacing={2}>
          {pendingReports.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: '12px' }}>
              No pending content reports! Community moderation queue is completely clear.
            </Alert>
          ) : (
            pendingReports.map((report) => (
              <Card
                key={report.id}
                data-testid={`report-card-${report.id}`}
                sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', p: 1 }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={report.targetType.toUpperCase()}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="subtitle1" fontWeight={700}>
                        Reported by {report.reporterName}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(report.createdAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Typography variant="body2" fontWeight={600} color="error.main" sx={{ mb: 1 }}>
                    Reason: {report.reason}
                  </Typography>

                  {report.targetContentSnippet && (
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover', borderRadius: '10px' }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        FLAGGED CONTENT SNIPPET:
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        &ldquo;{report.targetContentSnippet}&rdquo;
                      </Typography>
                    </Paper>
                  )}

                  {/* Actions */}
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() => handleOpenActionModal(report, 'dismiss')}
                    >
                      Dismiss Report
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<LockIcon />}
                      onClick={() => handleOpenActionModal(report, 'lock')}
                    >
                      Lock Content
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleOpenActionModal(report, 'delete')}
                    >
                      Delete Content
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<BlockIcon />}
                      onClick={() => handleOpenActionModal(report, 'ban_user')}
                    >
                      Ban User
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}

      {/* Tab 1: Join Requests */}
      {tabValue === 1 && (
        <Stack spacing={2}>
          {joinRequests.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
              No pending membership requests for this private community.
            </Typography>
          ) : (
            joinRequests.map((req) => (
              <Card key={req.id} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', p: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={req.userAvatar}>{req.userName.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {req.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {req.userTitle || 'Candidate Member'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={req.status}
                      color={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'warning'}
                      sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                    />
                  </Box>

                  {req.reason && (
                    <Typography variant="body2" sx={{ my: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: '8px' }}>
                      &ldquo;{req.reason}&rdquo;
                    </Typography>
                  )}

                  {req.status === 'pending' && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleApproveJoin(req.id, true)}
                      >
                        Approve Membership
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleApproveJoin(req.id, false)}
                      >
                        Reject
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}

      {/* Tab 2: Audit Log */}
      {tabValue === 2 && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Target</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reporter</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action Taken</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Moderator</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resolvedActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No moderation actions logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                resolvedActions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.targetType.toUpperCase()}</TableCell>
                    <TableCell>{row.reporterName}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.actionTaken || 'resolved'}
                        color={row.actionTaken === 'dismiss' ? 'default' : 'error'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>{row.moderatorName || 'System'}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Resolution Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Execute Moderation Action: {actionType.toUpperCase()}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Moderator Notes / Rationale"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explain reason for this decision..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleResolveActionSubmit} variant="contained" color="error">
            Confirm & Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
