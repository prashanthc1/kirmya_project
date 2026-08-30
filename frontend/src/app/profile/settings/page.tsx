'use client';

import React from 'react';
import { AuthenticatedLayout } from '../../components/shell';
import ProfilePrivacySettings from '../../components/profile/ProfilePrivacySettings';

export const dynamic = 'force-dynamic';

export default function ProfileSettingsPage() {
  return (
    <AuthenticatedLayout maxWidth="standard">
      <ProfilePrivacySettings />
    </AuthenticatedLayout>
  );
}
