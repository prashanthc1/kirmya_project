'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  useTheme,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface OnboardingFormData {
  companyName: string;
  jobTitle: string;
  recruiterRole: string;
  department: string;
  professionalInfo: string;
  contactPhone: string;
  contactEmail: string;
  authorizedAgreement: boolean;
}

const roles = [
  'Organization Owner',
  'Hiring Manager',
  'Recruiter',
  'Recruiter Admin',
  'Interviewer',
  'Viewer',
];

const departments = [
  'Human Resources',
  'Talent Acquisition',
  'Engineering',
  'Product Design',
  'Operations',
  'Executive Management',
];

export const RecruiterOnboarding: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState<OnboardingFormData>({
    companyName: 'TechCorp Global',
    jobTitle: 'Senior Talent Acquisition Partner',
    recruiterRole: 'Recruiter',
    department: 'Talent Acquisition',
    professionalInfo: '10+ years technical recruiting across EMEA and North America.',
    contactPhone: '+971 50 123 4567',
    contactEmail: 'recruiter@techcorp.ae',
    authorizedAgreement: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const steps = ['Company Details', 'Recruiter Role & Info', 'Verification & Access'];

  const handleChange = (field: keyof OnboardingFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCompleted(true);
      if (onComplete) onComplete();
    }, 1200);
  };

  return (
    <Box sx={{ maxWidth: 840, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.entrance}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Chip
            icon={<VerifiedUserIcon sx={{ fontSize: '1rem !important' }} />}
            label="VERIFIED EMPLOYER ONBOARDING"
            color="primary"
            sx={{ fontWeight: 800, mb: 1.5, px: 1, py: 0.5, borderRadius: '8px' }}
          />
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            Recruiter &amp; Employer Onboarding
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set up your organization&apos;s hiring profile to create jobs, discover candidates, and schedule interviews.
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: '24px',
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            p: { xs: 2, md: 4 },
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {completed ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                Verification Submitted!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your organization access has been provisioned. You can now publish jobs and access the candidate pipeline.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => (window.location.href = '/recruiter/dashboard')}
                sx={{
                  borderRadius: '12px',
                  fontWeight: 800,
                  px: 4,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                }}
              >
                Go to Recruiter Dashboard
              </Button>
            </Box>
          ) : (
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {activeStep === 0 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="e.g. Stripe Global / TechCorp"
                      InputProps={{
                        startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Department"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                    >
                      {departments.map((dep) => (
                        <MenuItem key={dep} value={dep}>
                          {dep}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Work Email"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}

              {activeStep === 1 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Job Title"
                      value={formData.jobTitle}
                      onChange={(e) => handleChange('jobTitle', e.target.value)}
                      placeholder="e.g. Head of Talent Acquisition"
                      InputProps={{
                        startAdornment: <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Recruiter Role"
                      value={formData.recruiterRole}
                      onChange={(e) => handleChange('recruiterRole', e.target.value)}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Professional Information"
                      value={formData.professionalInfo}
                      onChange={(e) => handleChange('professionalInfo', e.target.value)}
                      placeholder="Brief summary of your recruiting background and focus areas."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Phone"
                      value={formData.contactPhone}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}

              {activeStep === 2 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Company Authorization Requirement
                    </Typography>
                    By completing onboarding, you confirm that you are an authorized representative of{' '}
                    <strong>{formData.companyName || 'your organization'}</strong> and agree to follow Fair Hiring laws and
                    privacy standards.
                  </Alert>

                  <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                      Summary of Onboarding Details:
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Company:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formData.companyName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Role:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formData.recruiterRole} ({formData.jobTitle})</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Department:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formData.department}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Contact Email:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formData.contactEmail}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.authorizedAgreement}
                        onChange={(e) => handleChange('authorizedAgreement', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I certify that I am authorized to recruit and schedule interviews on behalf of this organization.
                      </Typography>
                    }
                  />
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button disabled={activeStep === 0} onClick={handleBack} sx={{ borderRadius: '10px' }}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={submitting || (activeStep === 2 && !formData.authorizedAgreement)}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 800,
                    px: 3.5,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  }}
                >
                  {activeStep === steps.length - 1 ? (submitting ? 'Submitting...' : 'Complete Verification') : 'Continue'}
                </Button>
              </Box>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </Box>
  );
};

export default RecruiterOnboarding;
