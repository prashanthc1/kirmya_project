'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  useTheme,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import JobApplicationQuestions, { CustomQuestion } from './JobApplicationQuestions';

interface Props {
  jobId?: string;
  initialData?: any;
}

export const JobEditor: React.FC<Props> = ({ jobId, initialData }) => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [formData, setFormData] = useState({
    title: initialData?.title || 'Senior Microservices Engineer (Golang)',
    department: initialData?.department || 'Engineering & Technology',
    employmentType: initialData?.employmentType || 'Full-time',
    workplaceType: initialData?.workplaceType || 'Remote',
    location: initialData?.location || 'Dubai, UAE',
    salaryRange: initialData?.salaryRange || '$110,000 - $150,000',
    currency: initialData?.currency || 'USD',
    experienceLevel: initialData?.experienceLevel || 'Senior Level (5+ Years)',
    education: initialData?.education || "Bachelor's Degree in Computer Science",
    description: initialData?.description || 'We are seeking an experienced Golang Engineer to design high-scale microservices.',
    responsibilities: initialData?.responsibilities || 'Build low-latency REST APIs, optimize PostgreSQL query performance, mentor team.',
    qualifications: initialData?.qualifications || '5+ years experience building Golang backend microservices.',
    benefits: initialData?.benefits || 'Full health insurance, flexible working hours, annual performance bonus.',
    deadline: initialData?.deadline || '2026-10-30',
    openingsCount: initialData?.openingsCount || 2,
    status: initialData?.status || 'Active',
  });

  const [requiredSkills, setRequiredSkills] = useState<string[]>(
    initialData?.requiredSkills || ['Golang', 'PostgreSQL', 'Docker', 'REST API', 'Kubernetes']
  );
  const [preferredSkills, setPreferredSkills] = useState<string[]>(
    initialData?.preferredSkills || ['Kafka', 'Redis', 'GraphQL', 'Next.js']
  );
  const [certifications, setCertifications] = useState<string[]>(
    initialData?.certifications || ['AWS Certified Solutions Architect', 'Certified Kubernetes Administrator']
  );

  const [questions, setQuestions] = useState<CustomQuestion[]>(
    initialData?.questions || [
      {
        id: 'q1',
        questionText: 'Do you have 5+ years of experience developing microservices in Go?',
        questionType: 'YesNo',
        options: [],
        isRequired: true,
      },
    ]
  );

  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (status: 'Active' | 'Draft') => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      router.push('/recruiter/jobs');
    }, 1000);
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        p: { xs: 2.5, md: 4 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/recruiter/jobs')} sx={{ fontWeight: 700 }}>
            Back to Jobs
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            {jobId ? 'Edit Job Opening' : 'Create New Job Opening'}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => handleSave('Draft')}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            startIcon={<PublishIcon />}
            onClick={() => handleSave('Active')}
            disabled={saving}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              px: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            }}
          >
            {saving ? 'Publishing...' : 'Publish Job'}
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 4 }} />

      {/* Section 1: Overview */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
        1. Role &amp; Organization Details
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            label="Job Title *"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            select
            label="Department"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
          >
            {['Engineering & Technology', 'Facilities & Real Estate', 'Human Resources', 'Finance', 'Sales', 'Product'].map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            select
            label="Employment Type"
            value={formData.employmentType}
            onChange={(e) => handleChange('employmentType', e.target.value)}
          >
            {['Full-time', 'Part-time', 'Contract', 'Internship'].map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            select
            label="Workplace Type"
            value={formData.workplaceType}
            onChange={(e) => handleChange('workplaceType', e.target.value)}
          >
            {['On-site', 'Hybrid', 'Remote'].map((w) => (
              <MenuItem key={w} value={w}>
                {w}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            select
            label="Experience Level"
            value={formData.experienceLevel}
            onChange={(e) => handleChange('experienceLevel', e.target.value)}
          >
            {['Entry Level', 'Mid Level', 'Senior Level (5+ Years)', 'Lead / Principal', 'Executive'].map((ex) => (
              <MenuItem key={ex} value={ex}>
                {ex}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Job Description *"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Key Responsibilities *"
            value={formData.responsibilities}
            onChange={(e) => handleChange('responsibilities', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Qualifications *"
            value={formData.qualifications}
            onChange={(e) => handleChange('qualifications', e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Section 2: Skills & Certifications */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
        2. Skills &amp; Qualifications
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            multiple
            freeSolo
            options={['Golang', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Python']}
            value={requiredSkills}
            onChange={(_, val) => setRequiredSkills(val)}
            renderTags={(val, getTagProps) =>
              val.map((opt, i) => (
                <Chip label={opt} size="small" color="primary" {...getTagProps({ index: i })} key={opt} />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Required Skills *" placeholder="Add skill" />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            multiple
            freeSolo
            options={['Kafka', 'Redis', 'GraphQL', 'Next.js', 'Terraform', 'CI/CD']}
            value={preferredSkills}
            onChange={(_, val) => setPreferredSkills(val)}
            renderTags={(val, getTagProps) =>
              val.map((opt, i) => (
                <Chip label={opt} size="small" variant="outlined" {...getTagProps({ index: i })} key={opt} />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Preferred Skills" placeholder="Add skill" />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Education Requirement"
            value={formData.education}
            onChange={(e) => handleChange('education', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            multiple
            freeSolo
            options={['AWS Certified Solutions Architect', 'Certified Kubernetes Administrator', 'PMP']}
            value={certifications}
            onChange={(_, val) => setCertifications(val)}
            renderTags={(val, getTagProps) =>
              val.map((opt, i) => (
                <Chip label={opt} size="small" color="secondary" {...getTagProps({ index: i })} key={opt} />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Certifications" placeholder="Add certification" />}
          />
        </Grid>
      </Grid>

      {/* Section 3: Compensation & Logistics */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
        3. Compensation &amp; Logistics
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Salary Range"
            value={formData.salaryRange}
            onChange={(e) => handleChange('salaryRange', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            label="Currency"
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            type="number"
            label="Number of Openings"
            value={formData.openingsCount}
            onChange={(e) => handleChange('openingsCount', parseInt(e.target.value, 10))}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Application Deadline"
            InputLabelProps={{ shrink: true }}
            value={formData.deadline}
            onChange={(e) => handleChange('deadline', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Benefits Overview"
            value={formData.benefits}
            onChange={(e) => handleChange('benefits', e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Custom Questions Builder */}
      <Divider sx={{ my: 4 }} />
      <JobApplicationQuestions questions={questions} onChange={setQuestions} />

      <Divider sx={{ my: 4 }} />

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button variant="outlined" onClick={() => router.push('/recruiter/jobs')} sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => handleSave('Active')}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            px: 4,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          }}
        >
          Save &amp; Publish Job
        </Button>
      </Stack>
    </Card>
  );
};

export default JobEditor;
