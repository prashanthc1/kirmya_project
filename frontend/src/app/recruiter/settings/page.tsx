'use client';

import React, { useState } from 'react';
import { Box, Typography, Card, Tab, Tabs } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import TeamManagement from '../../../components/recruiter/TeamManagement';
import MessageTemplates from '../../../components/recruiter/MessageTemplates';
import CandidateTags from '../../../components/recruiter/CandidateTags';

export default function RecruiterSettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  const [tags, setTags] = useState([
    { id: '1', name: 'High Priority', color: '#EF4444' },
    { id: '2', name: 'Technical Leader', color: '#6366F1' },
    { id: '3', name: 'Immediate Joiner', color: '#10B981' },
  ]);

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Recruiter &amp; Organization Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure hiring team members, reusable message templates, candidate tags, and RBAC permissions.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '20px', p: 1, mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Team & Role Permissions" sx={{ fontWeight: 800 }} />
          <Tab label="Message Templates" sx={{ fontWeight: 800 }} />
          <Tab label="Organization Tags" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {activeTab === 0 && <TeamManagement />}
      {activeTab === 1 && <MessageTemplates />}
      {activeTab === 2 && (
        <Card sx={{ borderRadius: '20px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Manage Candidate Organization Tags
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Organization-scoped tags applied to candidates during screening and interview stages.
          </Typography>
          <CandidateTags tags={tags} onChange={setTags} />
        </Card>
      )}
    </RecruiterLayout>
  );
}
