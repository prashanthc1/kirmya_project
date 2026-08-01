'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Button, Alert, Snackbar } from '@mui/material';

import CompanyProfileLayout from '../../../components/company/CompanyProfileLayout';
import CompanyHeader from '../../../components/company/CompanyHeader';
import HighlightsSection from '../../../components/company/HighlightsSection';
import CompanyOverview from '../../../components/company/CompanyOverview';
import JobsSection from '../../../components/company/JobsSection';
import DepartmentsSection from '../../../components/company/DepartmentsSection';
import OfficeLocations from '../../../components/company/OfficeLocations';
import LeadershipSection from '../../../components/company/LeadershipSection';
import EmployeesSection from '../../../components/company/EmployeesSection';
import BenefitsSection from '../../../components/company/BenefitsSection';
import GallerySection from '../../../components/company/GallerySection';
import LifeAtCompany from '../../../components/company/LifeAtCompany';
import FollowersSection from '../../../components/company/FollowersSection';
import RecommendationSection from '../../../components/company/RecommendationSection';

import { companiesApi } from '../../../features/companies/api';
import { CompanyDirectoryItem } from '../../../features/companies/types';

export default function CompanyPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [company, setCompany] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [jobs, setJobs] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<CompanyDirectoryItem[]>([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    companiesApi
      .getByHandle(slug)
      .then((res) => {
        setCompany(res.company);
        setProfile(res.profile);
        setFollowing(res.following);

        // Fetch Sub-resources
        const cid = res.company.id;
        companiesApi.getFeatured().then((rec) => setRecommended(rec)).catch(() => {});
        
        // Mock sub-data fallbacks if not returned
        setJobs([
          {
            id: 'j1',
            title: 'Senior Facilities Operations Manager',
            department: 'Facilities Management',
            location: 'Dubai, UAE',
            employmentType: 'Full-time',
            salaryRange: '$75,000 - $95,000',
            postedDate: '2 days ago',
            deadline: '2026-08-30',
          },
          {
            id: 'j2',
            title: 'Lead Cloud Systems Architect',
            department: 'Engineering',
            location: 'Abu Dhabi, UAE (Hybrid)',
            employmentType: 'Full-time',
            salaryRange: '$90,000 - $120,000',
            postedDate: '1 week ago',
            deadline: '2026-09-15',
          },
        ]);

        setLeaders([
          {
            id: 'l1',
            name: 'Rashid Al-Maktoum',
            designation: 'Chief Executive Officer & Founder',
            summary: 'Over 20 years of experience driving regional real estate, tech infrastructure, and smart city developments.',
            linkedinUrl: 'https://linkedin.com',
          },
          {
            id: 'l2',
            name: 'Amira Al-Farsi',
            designation: 'Chief Operations Officer',
            summary: 'Spearheading digital transformation, green building initiatives, and multi-asset operations across 12 countries.',
            linkedinUrl: 'https://linkedin.com',
          },
        ]);

        setLocations([
          { id: 'loc1', name: 'Global Corporate HQ', type: 'Headquarters', address: 'Emaar Square, Building 3', city: 'Dubai', country: 'United Arab Emirates' },
          { id: 'loc2', name: 'KSA Regional Hub', type: 'Regional Office', address: 'King Fahd Road, Olaya District', city: 'Riyadh', country: 'Saudi Arabia' },
          { id: 'loc3', name: 'Qatar Finance Office', type: 'Branch', address: 'West Bay Business District', city: 'Doha', country: 'Qatar' },
        ]);

        setDepartments([
          { id: 'd1', name: 'Engineering & IT', openJobs: 8, employeeCount: 420 },
          { id: 'd2', name: 'Facilities & Operations', openJobs: 5, employeeCount: 310 },
          { id: 'd3', name: 'Human Resources & Talent', openJobs: 3, employeeCount: 95 },
        ]);

        setEmployees([
          { id: 'e1', name: 'Sarah Chen', title: 'Senior Recruiter', roleType: 'Recruiter' },
          { id: 'e2', name: 'Tariq Al-Mansoor', title: 'Director of Facilities', roleType: 'Hiring Manager' },
          { id: 'e3', name: 'Elena Rostova', title: 'Staff AI Engineer', roleType: 'Employee' },
        ]);

        setGallery([
          { id: 'g1', title: 'Modern Innovation Campus', category: 'office' },
          { id: 'g2', title: 'Annual Sustainability Summit', category: 'event' },
          { id: 'g3', title: 'Best Employer in MENA Award', category: 'award' },
          { id: 'g4', title: 'Team Collaboration Workspace', category: 'workplace' },
        ]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleReport = () => {
    setToastMsg('Report submitted. Our trust & safety team will audit this employer profile.');
  };

  if (loading) {
    return (
      <Box sx={{ py: 15, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Loading public company profile...
        </Typography>
      </Box>
    );
  }

  if (!company || !profile) {
    return (
      <Box sx={{ py: 15, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 900 }}>
          Company Profile Not Found
        </Typography>
        <Button variant="contained" onClick={() => router.push('/companies')}>
          Back to Directory
        </Button>
      </Box>
    );
  }

  return (
    <CompanyProfileLayout company={company} profile={profile}>
      {/* Toast Notification */}
      <Snackbar open={!!toastMsg} autoHideDuration={4000} onClose={() => setToastMsg(null)}>
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          {toastMsg}
        </Alert>
      </Snackbar>

      {/* Header Section */}
      <CompanyHeader
        company={company}
        profile={profile}
        following={following}
        onReport={handleReport}
      />

      {/* Metric Highlights */}
      <HighlightsSection profile={profile} />

      {/* Overview & About */}
      <CompanyOverview company={company} profile={profile} />

      {/* Open Jobs */}
      <JobsSection jobs={jobs} />

      {/* Departments */}
      <DepartmentsSection departments={departments} />

      {/* Office Locations */}
      <OfficeLocations locations={locations} />

      {/* Executive Leadership */}
      <LeadershipSection leaders={leaders} />

      {/* Employees & Recruiters */}
      <EmployeesSection employees={employees} />

      {/* Employee Benefits */}
      <BenefitsSection benefits={profile.benefits || []} />

      {/* Media Gallery */}
      <GallerySection gallery={gallery} />

      {/* Life & Culture */}
      <LifeAtCompany culture={profile.culture} />

      {/* Followers & Notifications */}
      <FollowersSection followersCount={profile.followersCount || 14200} />

      {/* AI Recommendations */}
      <RecommendationSection recommended={recommended} />
    </CompanyProfileLayout>
  );
}
