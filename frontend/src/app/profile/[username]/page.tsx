'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Grid, Box, CircularProgress, Typography } from '@mui/material';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileExperience from '@/components/profile/ProfileExperience';
import ProfileEducation from '@/components/profile/ProfileEducation';
import ProfileSkills from '@/components/profile/ProfileSkills';
import ProfileCertifications from '@/components/profile/ProfileCertifications';
import ProfileLanguages from '@/components/profile/ProfileLanguages';
import ProfileProjects from '@/components/profile/ProfileProjects';
import ProfileAchievements from '@/components/profile/ProfileAchievements';
import ProfileReportDialog from '@/components/profile/ProfileReportDialog';
import { ProfileData, profileApi } from '@/features/profile/services/profileApi';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (username) {
      profileApi
        .getPublicProfile(username)
        .then((data) => setProfile(data))
        .catch(() => {});
    }
  }, [username]);

  const publicData: ProfileData = profile || {
    id: 'public-profile',
    userId: 'user-public',
    username: username || 'candidate',
    firstName: 'Public',
    lastName: 'Candidate',
    avatarUrl: '',
    coverUrl: '',
    headline: 'Senior Software Engineer',
    summary: 'Public candidate profile on Kirmya.',
    location: 'Dubai, UAE',
    country: 'UAE',
    industry: 'Technology',
    currentPosition: 'Senior Software Engineer',
    availabilityStatus: 'open_to_work',
    openToWork: true,
    openToRecruiters: true,
    targetRoles: ['Senior Software Engineer'],
    preferredLocations: ['Dubai'],
    profileCompletedPercentage: 90,
    volunteering: '',
    publications: '',
    licenses: '',
    verificationStatus: 'verified',
    isRestricted: false,
    isPrivate: false,
    profileViewsCount: 150,
    searchAppearancesCount: 400,
    workExperiences: [],
    educations: [],
    skills: [{ name: 'React' }, { name: 'Golang' }],
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProfileHeader
        profile={publicData}
        isOwner={false}
        onReport={() => setReportOpen(true)}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ProfileAbout summary={publicData.summary} />
          <ProfileExperience experiences={publicData.workExperiences} />
          <ProfileEducation educations={publicData.educations} />
          <ProfileProjects projects={publicData.projects} />
        </Grid>

        <Grid item xs={12} md={4}>
          <ProfileSkills skills={publicData.skills} />
          <ProfileCertifications certifications={publicData.certifications} />
          <ProfileLanguages languages={publicData.languages} />
          <ProfileAchievements achievements={publicData.achievements} />
        </Grid>
      </Grid>

      <ProfileReportDialog
        open={reportOpen}
        username={username || 'candidate'}
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, desc) => {
          await profileApi.reportProfile(username || 'candidate', reason, desc);
          alert('Thank you. Profile report received.');
        }}
      />
    </Container>
  );
}
