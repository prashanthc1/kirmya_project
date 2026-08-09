'use client';

import React, { useState } from 'react';
import { Box, Container, Grid, Typography, Button, Stack, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { Resume } from '@/features/resume/types';
import { ResumeSectionEditor } from './ResumeSectionEditor';
import { ResumePreview } from './ResumePreview';
import { ATSScoreCard } from './ATSScoreCard';
import { AIResumeAssistant } from './AIResumeAssistant';
import { ResumeVersionManager } from './ResumeVersionManager';

interface ResumeEditorProps {
  resume: Resume;
  onSave: (updatedSections: any[]) => void;
  onOptimize: () => void;
  onDownload: () => void;
  versions?: any[];
  onRestoreVersion?: (ver: any) => void;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  resume,
  onSave,
  onOptimize,
  onDownload,
  versions = [],
  onRestoreVersion = () => {},
}) => {
  const [sections, setSections] = useState(resume.sections || []);
  const [showPreview, setShowPreview] = useState(true);

  const handleSectionsChange = (updated: any[]) => {
    setSections(updated);
  };

  const handleSaveClick = () => {
    onSave(sections);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {resume.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Template: {resume.templateName.toUpperCase()} • Live ATS Optimization
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => setShowPreview(!showPreview)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onDownload}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveClick}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, px: 3 }}
          >
            Save Resume
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={showPreview ? 7 : 12}>
          <Stack spacing={3}>
            <ATSScoreCard score={resume.atsScore} />
            <AIResumeAssistant onOptimize={onOptimize} />
            <ResumeSectionEditor sections={sections} onChange={handleSectionsChange} />
            <ResumeVersionManager versions={versions} onRestore={onRestoreVersion} />
          </Stack>
        </Grid>

        {showPreview && (
          <Grid item xs={12} lg={5}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Live Resume Document Preview
              </Typography>
              <ResumePreview resume={{ ...resume, sections }} zoom={0.7} />
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};
