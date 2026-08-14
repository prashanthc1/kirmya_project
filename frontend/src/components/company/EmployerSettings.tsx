'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';

import { CompanyDataExport, EmployerSettings as EmployerSettingsType } from '../../features/company/types';
import { useEmployerSettings, useUpdateEmployerSettings, useExportCompanyData } from '../../features/company/hooks';
import GlassPanel from './GlassPanel';

export interface EmployerSettingsProps {
  companyId: string;
  initialSettings?: EmployerSettingsType;
  readOnly?: boolean;
}

export const EmployerSettings: React.FC<EmployerSettingsProps> = ({
  companyId,
  initialSettings,
  readOnly = false,
}) => {
  const { data: fetchedSettings, isLoading, isError, error } = useEmployerSettings(companyId, {
    initialData: initialSettings,
  });

  const updateMutation = useUpdateEmployerSettings(companyId);
  const exportMutation = useExportCompanyData(companyId);

  const settings = fetchedSettings || initialSettings;

  // Local form state
  const [defaultPipeline, setDefaultPipeline] = React.useState<string>('standard');
  const [defaultRecruiterId, setDefaultRecruiterId] = React.useState<string>('');
  const [newAppNotif, setNewAppNotif] = React.useState<boolean>(true);
  const [candMsgNotif, setCandMsgNotif] = React.useState<boolean>(true);
  const [interviewNotif, setInterviewNotif] = React.useState<boolean>(true);
  const [autoAck, setAutoAck] = React.useState<boolean>(true);
  const [autoAckMsg, setAutoAckMsg] = React.useState<string>('');
  const [visibilityMode, setVisibilityMode] = React.useState<string>('team_only');

  const [exportResult, setExportResult] = React.useState<CompanyDataExport | null>(null);
  const [snackbarMsg, setSnackbarMsg] = React.useState<string>('');

  React.useEffect(() => {
    if (settings) {
      setDefaultPipeline(settings.defaultPipeline || 'standard');
      setDefaultRecruiterId(settings.defaultRecruiterId || '');
      setNewAppNotif(settings.newApplicationNotification ?? true);
      setCandMsgNotif(settings.candidateMessageNotification ?? true);
      setInterviewNotif(settings.interviewReminderNotification ?? true);
      setAutoAck(settings.autoAcknowledgeApplication ?? true);
      setAutoAckMsg(settings.autoAcknowledgeMessage || '');
      setVisibilityMode(settings.candidateVisibilityMode || 'team_only');
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        defaultPipeline,
        defaultRecruiterId: defaultRecruiterId || undefined,
        newApplicationNotification: newAppNotif,
        candidateMessageNotification: candMsgNotif,
        interviewReminderNotification: interviewNotif,
        autoAcknowledgeApplication: autoAck,
        autoAcknowledgeMessage: autoAckMsg,
        candidateVisibilityMode: visibilityMode,
      },
      {
        onSuccess: () => {
          setSnackbarMsg('Employer recruitment settings updated successfully!');
        },
      }
    );
  };

  const handleExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: (data) => {
        setExportResult(data);
        setSnackbarMsg('Data export generated successfully.');
      },
    });
  };

  if (isLoading && !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {isError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {(error as Error)?.message || 'Failed to load employer settings.'}
        </Alert>
      )}

      {readOnly && (
        <Alert severity="info" sx={{ borderRadius: '16px' }}>
          You are viewing recruitment settings in read-only mode.
        </Alert>
      )}

      {/* Recruitment Pipeline & Defaults */}
      <GlassPanel title="Pipeline & Default Assignments">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure standard workflows for incoming applications and recruiter defaults.
        </Typography>

        <Stack spacing={2.5} sx={{ maxWidth: 600 }}>
          <FormControl fullWidth size="small" disabled={readOnly}>
            <InputLabel id="default-pipeline-label">Default Application Pipeline</InputLabel>
            <Select
              labelId="default-pipeline-label"
              value={defaultPipeline}
              label="Default Application Pipeline"
              onChange={(e) => setDefaultPipeline(e.target.value)}
            >
              <MenuItem value="standard">Standard (Screening → Interview → Offer)</MenuItem>
              <MenuItem value="fast_track">Fast Track (Interview → Offer)</MenuItem>
              <MenuItem value="executive">Executive (Screening → Panel → Tech → Exec → Offer)</MenuItem>
              <MenuItem value="custom">Custom Organization Pipeline</MenuItem>
            </Select>
            <FormHelperText>Assigned automatically when candidates submit applications.</FormHelperText>
          </FormControl>

          <TextField
            label="Default Recruiter ID"
            variant="outlined"
            size="small"
            fullWidth
            disabled={readOnly}
            value={defaultRecruiterId}
            onChange={(e) => setDefaultRecruiterId(e.target.value)}
            placeholder="e.g. rec_12345"
            helperText="Recruiter automatically assigned to unassigned incoming applications"
          />

          <FormControl fullWidth size="small" disabled={readOnly}>
            <InputLabel id="candidate-visibility-label">Candidate Visibility Mode</InputLabel>
            <Select
              labelId="candidate-visibility-label"
              value={visibilityMode}
              label="Candidate Visibility Mode"
              onChange={(e) => setVisibilityMode(e.target.value)}
            >
              <MenuItem value="public">Public to All Recruiters & Managers</MenuItem>
              <MenuItem value="team_only">Team & Assigned Hiring Managers Only</MenuItem>
              <MenuItem value="restricted">Restricted (Owner & Assigned Recruiter Only)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </GlassPanel>

      {/* Auto-Acknowledgement Settings */}
      <GlassPanel title="Candidate Auto-Acknowledgement">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Send automated receipt responses to candidates upon applying.
        </Typography>

        <Stack spacing={2} sx={{ maxWidth: 600 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoAck}
                disabled={readOnly}
                onChange={(e) => setAutoAck(e.target.checked)}
              />
            }
            label="Send automated acknowledgement message on application submit"
          />

          {autoAck && (
            <TextField
              label="Auto-Acknowledgement Message"
              multiline
              rows={4}
              fullWidth
              size="small"
              disabled={readOnly}
              value={autoAckMsg}
              onChange={(e) => setAutoAckMsg(e.target.value)}
              placeholder="Thank you for applying to our team! We have received your application and will review it shortly."
            />
          )}
        </Stack>
      </GlassPanel>

      {/* Notifications */}
      <GlassPanel title="Recruitment Notifications">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose alerts and notifications sent to recruiters and hiring managers.
        </Typography>

        <Stack spacing={1.5}>
          <FormControlLabel
            control={
              <Switch
                checked={newAppNotif}
                disabled={readOnly}
                onChange={(e) => setNewAppNotif(e.target.checked)}
              />
            }
            label="Email notification on new job application submission"
          />

          <FormControlLabel
            control={
              <Switch
                checked={candMsgNotif}
                disabled={readOnly}
                onChange={(e) => setCandMsgNotif(e.target.checked)}
              />
            }
            label="Notification when candidate sends a message or response"
          />

          <FormControlLabel
            control={
              <Switch
                checked={interviewNotif}
                disabled={readOnly}
                onChange={(e) => setInterviewNotif(e.target.checked)}
              />
            }
            label="Send automated interview reminder alerts to interviewers & candidates"
          />
        </Stack>
      </GlassPanel>

      {/* Data Export Triggers */}
      <GlassPanel title="Data & Compliance Export">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Trigger a comprehensive export of company applicant records, job postings, and recruitment analytics. Retention period: {settings?.dataExportRetentionDays ?? 90} days.
        </Typography>

        <Stack direction="column" spacing={2} alignItems="flex-start">
          <Button
            variant="outlined"
            color="primary"
            startIcon={exportMutation.isPending ? <CircularProgress size={18} /> : <DownloadIcon />}
            disabled={readOnly || exportMutation.isPending}
            onClick={handleExport}
            sx={{ textTransform: 'none', borderRadius: '10px' }}
          >
            {exportMutation.isPending ? 'Generating Export...' : 'Export Company Data Package'}
          </Button>

          {exportResult && (
            <Alert severity="success" sx={{ width: '100%', borderRadius: '12px' }}>
              Export ready! Download link: {' '}
              <a href={exportResult.exportUrl} target="_blank" rel="noopener noreferrer">
                {exportResult.exportUrl || 'Download Package'}
              </a>{' '}
              (Expires: {new Date(exportResult.expiresAt).toLocaleDateString()})
            </Alert>
          )}
        </Stack>
      </GlassPanel>

      {/* Action Buttons */}
      {!readOnly && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={updateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={updateMutation.isPending}
            onClick={handleSave}
            sx={{ borderRadius: '10px', px: 3, textTransform: 'none', fontWeight: 600 }}
          >
            {updateMutation.isPending ? 'Saving Settings...' : 'Save Recruitment Settings'}
          </Button>
        </Box>
      )}

      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={4000}
        onClose={() => setSnackbarMsg('')}
        message={snackbarMsg}
      />
    </Stack>
  );
};

export default EmployerSettings;
