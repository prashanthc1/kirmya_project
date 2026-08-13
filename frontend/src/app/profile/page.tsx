'use client';

import React, { useEffect, useState } from 'react';
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
import ProfileCompletionCard from '@/components/onboarding/ProfileCompletionCard';
import { ProfileData, profileApi } from '@/features/profile/services/profileApi';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi
      .getMyProfile()
      .then((data) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const dummyProfile: ProfileData = profile || {
    id: 'demo-profile',
    userId: 'demo-user',
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: '',
    coverUrl: '',
    headline: 'Senior Distributed Systems Engineer & Cloud Architect',
    summary: 'Passionate engineering lead specializing in Go, React, PostgreSQL, and scalable microservices.',
    location: 'Dubai, UAE',
    country: 'United Arab Emirates',
    industry: 'Information Technology',
    currentPosition: 'Staff Software Engineer @ TechVentures',
    availabilityStatus: 'open_to_work',
    openToWork: true,
    openToRecruiters: true,
    targetRoles: ['Staff Software Engineer', 'Engineering Manager'],
    preferredLocations: ['Dubai', 'Remote'],
    profileCompletedPercentage: 85,
    volunteering: '',
    publications: '',
    licenses: '',
    verificationStatus: 'verified',
    isRestricted: false,
    isPrivate: false,
    profileViewsCount: 420,
    searchAppearancesCount: 1280,
    workExperiences: [
      {
        id: 'w1',
        company: 'TechVentures Inc.',
        jobTitle: 'Senior Software Engineer',
        employmentType: 'Full-time',
        location: 'Dubai, UAE',
        startDate: '2022-01-15',
        isCurrentJob: true,
        description: 'Led architecture for real-time candidate search engine serving 500K daily active queries.',
      },
    ],
    educations: [
      {
        id: 'e1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
      },
    ],
    skills: [
      { id: 's1', name: 'Golang', proficiencyLevel: 'Expert' },
      { id: 's2', name: 'React & Next.js', proficiencyLevel: 'Expert' },
      { id: 's3', name: 'PostgreSQL', proficiencyLevel: 'Advanced' },
    ],
    certifications: [
      { id: 'c1', name: 'AWS Certified Solutions Architect', issuingOrganization: 'Amazon Web Services' },
    ],
    projects: [
      { id: 'p1', title: 'Kirmya Platform Monolith', description: 'High performance professional networking platform.' },
    ],
    languages: [
      { id: 'l1', name: 'English', proficiency: 'Native' },
      { id: 'l2', name: 'Arabic', proficiency: 'Bilingual' },
    ],
    achievements: [
      { id: 'a1', title: 'Top Engineering Contributor Award 2024' },
    ],
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProfileHeader profile={dummyProfile} isOwner={true} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ProfileAbout summary={dummyProfile.summary} />
          <ProfileExperience experiences={dummyProfile.workExperiences} />
          <ProfileEducation educations={dummyProfile.educations} />
          <ProfileProjects projects={dummyProfile.projects} />
        </Grid>

        <Grid item xs={12} md={4}>
          <ProfileCompletionCard />
          <ProfileSkills skills={dummyProfile.skills} />
          <ProfileCertifications certifications={dummyProfile.certifications} />
          <ProfileLanguages languages={dummyProfile.languages} />
          <ProfileAchievements achievements={dummyProfile.achievements} />
        </Grid>
      </Grid>
    </Container>
  );
}
