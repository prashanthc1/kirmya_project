'use client';

import React from 'react';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import TeamManagement from '../../../components/recruiter/TeamManagement';

export default function RecruiterSettingsPage() {
  return (
    <RecruiterLayout>
      <TeamManagement />
    </RecruiterLayout>
  );
}
