'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Breadcrumbs,
  Chip,
  CircularProgress,
  Paper,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import { mentorshipApi } from '../../../features/mentorship/api';
import { MentorFilterParams, MentorProfile } from '../../../features/mentorship/types';
import MentorCard from '../../../components/mentorship/MentorCard';
import MentorFiltersSidebar from '../../../components/mentorship/MentorFiltersSidebar';
import MentorshipRequestModal from '../../../components/mentorship/MentorshipRequestModal';

export default function MentorDiscoveryPage() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [filters, setFilters] = useState<MentorFilterParams>({
    availability: 'all',
    format: 'all',
  });
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const loadMentors = async (currentFilters: MentorFilterParams) => {
    try {
      setLoading(true);
      const res = await mentorshipApi.searchMentors(currentFilters);
      setMentors(res);
    } catch (err) {
      console.error('Failed to load mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentors(filters);
  }, [filters]);

  const handleFilterChange = (newFilters: MentorFilterParams) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const reset = { availability: 'all' as const, format: 'all' as const };
    setFilters(reset);
  };

  const handleOpenRequestModal = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setRequestModalOpen(true);
  };

  const handleSendRequest = async (payload: any) => {
    await mentorshipApi.createMentorshipRequest(payload);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Typography component={Link} href="/mentorship" color="inherit" sx={{ textDecoration: 'none' }}>
          Mentorship
        </Typography>
        <Typography color="text.primary" fontWeight={600}>
          Browse Mentors
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
          Explore Industry Expert Mentors
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700 }}>
          Filter top mentors by domain expertise, technical stack, company background, and availability for personalized 1-on-1 career acceleration.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Sidebar Filters */}
        <Grid item xs={12} md={3.5} lg={3}>
          <MentorFiltersSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </Grid>

        {/* Mentors Grid */}
        <Grid item xs={12} md={8.5} lg={9}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Available Mentors ({mentors.length})
            </Typography>
            <Chip
              label={`${mentors.length} Verified Mentors`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : mentors.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '20px' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No Mentors Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try adjusting your search criteria or resetting filters to view more mentors.
              </Typography>
              <Button onClick={handleResetFilters} variant="contained">
                Reset All Filters
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {mentors.map((mentor) => (
                <Grid item xs={12} sm={6} lg={4} key={mentor.id}>
                  <MentorCard
                    mentor={mentor}
                    onRequestMentorship={handleOpenRequestModal}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Mentorship Request Modal */}
      <MentorshipRequestModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        mentor={selectedMentor}
        onSubmit={handleSendRequest}
      />
    </Container>
  );
}
