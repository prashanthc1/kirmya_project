'use client';

import React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';
import CardMembershipIcon from '@mui/icons-material/CardMembership';

import { PersonalInfoEditor } from './PersonalInfoEditor';
import { SummaryEditor } from './SummaryEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { EducationEditor } from './EducationEditor';
import { SkillsEditor } from './SkillsEditor';
import { CertificationEditor } from './CertificationEditor';
import { ProjectEditor } from './ProjectEditor';

interface ResumeSectionEditorProps {
  sections: any[];
  onChange: (sections: any[]) => void;
}

export const ResumeSectionEditor: React.FC<ResumeSectionEditorProps> = ({ sections, onChange }) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const getSectionContent = (type: string) => {
    const sec = sections.find((s) => s.sectionType === type);
    if (!sec || !sec.content) return null;
    try {
      return JSON.parse(sec.content);
    } catch {
      return null;
    }
  };

  const updateSection = (type: string, data: any) => {
    const contentStr = typeof data === 'string' ? JSON.stringify({ summary: data }) : JSON.stringify(data);
    const existing = sections.find((s) => s.sectionType === type);
    if (existing) {
      onChange(sections.map((s) => (s.sectionType === type ? { ...s, content: contentStr } : s)));
    } else {
      onChange([...sections, { sectionType: type, content: contentStr, sortOrder: sections.length }]);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<PersonIcon />} label="Personal Info" />
          <Tab icon={<DescriptionIcon />} label="Summary" />
          <Tab icon={<WorkIcon />} label="Experience" />
          <Tab icon={<SchoolIcon />} label="Education" />
          <Tab icon={<BuildIcon />} label="Skills" />
          <Tab icon={<CardMembershipIcon />} label="Certs & Projects" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <PersonalInfoEditor
          data={getSectionContent('personal_info') || {}}
          onChange={(data) => updateSection('personal_info', data)}
        />
      )}

      {activeTab === 1 && (
        <SummaryEditor
          summary={getSectionContent('summary')?.summary || ''}
          onChange={(text) => updateSection('summary', text)}
        />
      )}

      {activeTab === 2 && (
        <ExperienceEditor
          experiences={getSectionContent('experience') || []}
          onChange={(list) => updateSection('experience', list)}
        />
      )}

      {activeTab === 3 && (
        <EducationEditor
          education={getSectionContent('education') || []}
          onChange={(list) => updateSection('education', list)}
        />
      )}

      {activeTab === 4 && (
        <SkillsEditor
          skills={getSectionContent('skills') || []}
          onChange={(list) => updateSection('skills', list)}
        />
      )}

      {activeTab === 5 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <CertificationEditor
            items={getSectionContent('certs') || []}
            onChange={(list) => updateSection('certs', list)}
          />
          <ProjectEditor
            items={getSectionContent('projects') || []}
            onChange={(list) => updateSection('projects', list)}
          />
        </Box>
      )}
    </Paper>
  );
};
