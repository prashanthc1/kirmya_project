'use client';

import React from 'react';
import { Box, Paper, Typography, Divider, Chip, Stack } from '@mui/material';
import { Resume } from '@/features/resume/types';

interface ResumePreviewProps {
  resume: Resume;
  zoom?: number;
  deviceView?: 'desktop' | 'tablet' | 'mobile';
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  zoom = 1.0,
  deviceView = 'desktop',
}) => {
  const getContainerWidth = () => {
    if (deviceView === 'mobile') return '375px';
    if (deviceView === 'tablet') return '600px';
    return '800px'; // A4/Letter proportion width
  };

  // Extract sections safely
  const findSection = (type: string) => {
    return resume.sections?.find((s) => s.sectionType === type);
  };

  const parseJSON = (str?: string) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  const personalInfo = parseJSON(findSection('personal_info')?.content) || {
    fullName: 'Alex Morgan',
    professionalTitle: 'Senior Full-Stack Engineer',
    email: 'alex.morgan@kirmya.dev',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
  };

  const summary = parseJSON(findSection('summary')?.content)?.summary || 'Results-driven Senior Full-Stack Engineer with 6+ years of experience designing scalable microservices and Next.js applications.';

  const experience = parseJSON(findSection('experience')?.content) || [];
  const education = parseJSON(findSection('education')?.content) || [];
  const skills = parseJSON(findSection('skills')?.content) || [];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        overflowX: 'auto',
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: getContainerWidth(),
          minHeight: '1050px', // Letter ratio
          bgcolor: '#FFFFFF',
          color: '#111827',
          p: 5,
          fontFamily: resume.fontFamily || 'Inter, sans-serif',
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'all 0.2s ease',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          borderRadius: 2,
        }}
      >
        {/* Header Personal Info */}
        <Box sx={{ borderBottom: `2px solid ${resume.primaryColor || '#0066FF'}`, pb: 2.5, mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            {personalInfo.fullName}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: resume.primaryColor || '#0066FF', mt: 0.5, mb: 1.5 }}>
            {personalInfo.professionalTitle}
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ color: '#4B5563', fontSize: '0.85rem' }}>
            <span>{personalInfo.email}</span>
            <span>•</span>
            <span>{personalInfo.phone}</span>
            <span>•</span>
            <span>{personalInfo.location}</span>
            {personalInfo.linkedinUrl && (
              <>
                <span>•</span>
                <span>LinkedIn</span>
              </>
            )}
            {personalInfo.githubUrl && (
              <>
                <span>•</span>
                <span>GitHub</span>
              </>
            )}
          </Stack>
        </Box>

        {/* Professional Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: resume.primaryColor || '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
            Professional Summary
          </Typography>
          <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6 }}>
            {summary}
          </Typography>
        </Box>

        {/* Work Experience */}
        {Array.isArray(experience) && experience.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: resume.primaryColor || '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
              Work Experience
            </Typography>
            <Stack spacing={2}>
              {experience.map((exp: any, idx: number) => (
                <Box key={idx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                      {exp.jobTitle} — <span style={{ fontWeight: 600, color: '#4B5563' }}>{exp.company}</span>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
                      {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                    {exp.location}
                  </Typography>
                  {exp.description && (
                    <Typography variant="body2" sx={{ color: '#374151', mb: 0.5 }}>
                      {exp.description}
                    </Typography>
                  )}
                  {exp.responsibilities && Array.isArray(exp.responsibilities) && (
                    <Box component="ul" sx={{ pl: 2, m: 0, color: '#374151', fontSize: '0.85rem' }}>
                      {exp.responsibilities.map((r: string, rIdx: number) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Education */}
        {Array.isArray(education) && education.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: resume.primaryColor || '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
              Education
            </Typography>
            <Stack spacing={1.5}>
              {education.map((edu: any, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
                      {edu.degree} in {edu.fieldOfStudy}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4B5563' }}>
                      {edu.institution}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
                    {edu.startDate} - {edu.endDate}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Skills */}
        {Array.isArray(skills) && skills.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: resume.primaryColor || '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
              Skills & Expertise
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {skills.map((sk: any, idx: number) => (
                <Chip
                  key={idx}
                  label={sk.name || sk}
                  size="small"
                  sx={{
                    bgcolor: '#F3F4F6',
                    color: '#1F2937',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    border: '1px solid #E5E7EB',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
