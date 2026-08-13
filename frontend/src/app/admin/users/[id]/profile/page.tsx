'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AdminProfileView from '@/components/admin/profile/AdminProfileView';
import { ProfileData } from '@/features/profile/services/profileApi';

export default function AdminUserProfilePage() {
  const params = useParams();
  const userId = (params?.id as string) || 'demo-user-id';

  const adminProfile: ProfileData = {
    id: 'admin-profile-1',
    userId,
    username: 'audited_user',
    firstName: 'Audited',
    lastName: 'Candidate',
    avatarUrl: '',
    coverUrl: '',
    headline: 'Senior Systems Architect',
    summary: 'Candidate profile subject to admin moderation and verification review.',
    location: 'Dubai, UAE',
    country: 'UAE',
    industry: 'Technology',
    currentPosition: 'Senior Systems Architect',
    availabilityStatus: 'open_to_work',
    openToWork: true,
    openToRecruiters: true,
    targetRoles: ['Senior Systems Architect'],
    preferredLocations: ['Dubai'],
    profileCompletedPercentage: 90,
    volunteering: '',
    publications: '',
    licenses: '',
    verificationStatus: 'pending',
    isRestricted: false,
    isPrivate: false,
    profileViewsCount: 310,
    searchAppearancesCount: 890,
  };

  return <AdminProfileView profile={adminProfile} userId={userId} />;
}
